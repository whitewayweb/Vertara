import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import { getBrowserExportCapability } from "@/features/export/export-capabilities";
import { getOutputElapsedSeconds, type PlaybackSettings } from "@/features/project/playback-settings";
import { getTextOverlayEntranceProgress, getTextOverlayFontStack, isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import type { OutputSettings } from "@/features/project/output-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";
import { getVideoAdjustmentsFilter, type VideoAdjustments } from "@/features/render/video-adjustments";

export type ExportLayoutMode = "canvas" | "focus" | "poster";

export interface LocalMp4ExportRequest {
  abortSignal?: AbortSignal;
  canvasLayout: CanvasLayout;
  focusLayout: FocusLayout;
  overlays: TextOverlay[];
  mode: ExportLayoutMode;
  onProgress(progress: number): void;
  output: OutputSettings;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  sourceUrl: string;
  videoAdjustments: VideoAdjustments;
}

export class ExportCancelledError extends Error {
  constructor() {
    super("Export cancelled.");
    this.name = "ExportCancelledError";
  }
}

export async function exportLocalMp4(request: LocalMp4ExportRequest): Promise<Blob> {
  throwIfAborted(request.abortSignal);
  const capability = getBrowserExportCapability();
  if (capability.level === "unsupported") {
    throw new Error(capability.message);
  }

  const video = await loadVideo(request.sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = request.output.width;
  canvas.height = request.output.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot prepare the export canvas.");

  const sourceFps = 30;
  const fps = sourceFps * request.playback.speed;
  const frameDurationMicroseconds = Math.round(1_000_000 / fps);
  // Keep the same 30fps source samples as a normal-speed export, then encode
  // them at the faster output rate. This shortens duration without dropping
  // frames from Vertara's current fixed-rate renderer.
  const frameCount = Math.max(1, Math.ceil((request.playback.trimEndSeconds - request.playback.trimStartSeconds) * sourceFps));
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width: canvas.width, height: canvas.height },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  const encoderConfig: VideoEncoderConfig = {
    codec: getH264CodecForFramerate(fps),
    width: canvas.width,
    height: canvas.height,
    bitrate: 7_000_000 * request.playback.speed,
    framerate: fps,
  };
  const support = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!support.supported) {
    video.remove();
    throw new Error("This browser cannot encode the selected export size and speed as H.264 MP4. Try a lower speed or resolution.");
  }

  let encoderError: Error | undefined;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      try {
        muxer.addVideoChunk(chunk, metadata);
      } catch (error) {
        encoderError = error instanceof Error ? error : new Error("The browser could not package an encoded video frame.");
      }
    },
    error: (error) => {
      encoderError = error;
    },
  });
  encoder.configure(encoderConfig);

  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      throwIfAborted(request.abortSignal);
      if (encoderError) {
        throw new Error(`The browser encoder stopped: ${encoderError.message}`);
      }

      await seek(video, request.playback.trimStartSeconds + frameIndex / sourceFps);
      throwIfAborted(request.abortSignal);
      drawFrame(context, video, request);
      const frame = new VideoFrame(canvas, {
        duration: frameDurationMicroseconds,
        timestamp: frameIndex * frameDurationMicroseconds,
      });
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 });
      frame.close();

      if (encoder.encodeQueueSize > 2) {
        await encoder.flush();
      }
      request.onProgress((frameIndex + 1) / frameCount);
    }

    await encoder.flush();
    throwIfAborted(request.abortSignal);
    if (encoderError) {
      throw new Error(`The browser encoder stopped: ${encoderError.message}`);
    }
    muxer.finalize();
    return new Blob([target.buffer], { type: "video/mp4" });
  } finally {
    if (encoder.state !== "closed") {
      encoder.close();
    }
    video.remove();
  }
}

function getH264CodecForFramerate(framerate: number): string {
  // 1080 × 1920 needs a higher H.264 level as a retained frame sequence is
  // encoded into a shorter duration. Config support is still checked before
  // exporting, so unsupported devices receive the existing recoverable error.
  if (framerate <= 30) return "avc1.420028";
  if (framerate <= 60) return "avc1.42002A";
  if (framerate <= 120) return "avc1.420033";
  return "avc1.420034";
}

function throwIfAborted(abortSignal: AbortSignal | undefined): void {
  if (abortSignal?.aborted) {
    throw new ExportCancelledError();
  }
}

async function loadVideo(sourceUrl: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("The source video cannot be decoded for export."));
  });
  return video;
}

async function seek(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.001) return;
  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("The source video could not be rendered."));
    video.currentTime = time;
  });
}

function drawFrame(context: CanvasRenderingContext2D, video: HTMLVideoElement, request: LocalMp4ExportRequest): void {
  const { height, width } = request.output;
  context.clearRect(0, 0, width, height);
  if (request.mode === "poster") {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6d28d9"); gradient.addColorStop(0.5, "#c026d3"); gradient.addColorStop(1, "#fb923c");
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
    context.fillStyle = "white"; context.font = `600 ${Math.round(width * 0.07)}px sans-serif`; context.fillText(request.posterLayout.headline, width * 0.06, height * 0.12, width * 0.88);
    drawAdjustedContain(context, video, width * 0.06, height * 0.28, width * 0.88, height * 0.62, request.videoAdjustments);
    drawTextOverlays(context, request.overlays, getOutputElapsedSeconds(video.currentTime - request.playback.trimStartSeconds, request.playback), width, height);
    return;
  }
  if (request.mode === "focus") {
    drawAdjustedCover(context, video, 0, 0, width, height, request.focusLayout.panX, request.focusLayout.zoom, request.videoAdjustments);
    drawTextOverlays(context, request.overlays, getOutputElapsedSeconds(video.currentTime - request.playback.trimStartSeconds, request.playback), width, height);
    return;
  }
  context.save(); context.filter = `blur(${request.canvasLayout.backdropBlurPixels}px) ${getVideoAdjustmentsFilter(request.videoAdjustments)}`; context.globalAlpha = request.canvasLayout.backdropOpacity;
  drawCover(context, video, 0, 0, width, height, 50, 1.1); context.restore();
  context.fillStyle = `rgba(0,0,0,${request.canvasLayout.dimOpacity})`; context.fillRect(0, 0, width, height);
  drawAdjustedContain(context, video, 0, 0, width, height, request.videoAdjustments);
  drawTextOverlays(context, request.overlays, getOutputElapsedSeconds(video.currentTime - request.playback.trimStartSeconds, request.playback), width, height);
}

function drawTextOverlays(context: CanvasRenderingContext2D, overlays: TextOverlay[], elapsedSeconds: number, width: number, height: number): void {
  overlays.filter((overlay) => isTextOverlayVisible(overlay, elapsedSeconds)).forEach((overlay) => drawTextOverlay(context, overlay, elapsedSeconds, width, height));
}

function drawTextOverlay(
  context: CanvasRenderingContext2D,
  overlay: TextOverlay,
  elapsedSeconds: number,
  width: number,
  height: number,
): void {
  const fontSize = Math.round(width * (overlay.fontSizePercent / 100));
  const font = `800 ${fontSize}px ${getTextOverlayFontStack(overlay.fontFamily)}`;
  const maxWidth = width * (overlay.widthPercent / 100) - fontSize * 0.36;
  const lines = wrapText(context, overlay.text.trim(), font, maxWidth);
  const lineHeight = Math.round(fontSize * 1.2);
  const textHeight = lines.length * lineHeight;

  context.save();
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "top";
  const padding = fontSize * 0.18;
  const boxWidth = width * (overlay.widthPercent / 100);
  const boxHeight = textHeight + padding * 2;
  const x = width * (overlay.horizontalPositionPercent / 100);
  const y = height * (overlay.verticalPositionPercent / 100) - boxHeight / 2;
  const entranceProgress = getTextOverlayEntranceProgress(overlay, elapsedSeconds);
  const opacity = overlay.entranceAnimation === "none" ? 1 : entranceProgress;
  const scale = overlay.entranceAnimation === "pop" ? 0.72 + entranceProgress * 0.28 : 1;
  const slideOffset = overlay.entranceAnimation === "slide-up" ? fontSize * 0.65 * (1 - entranceProgress) : 0;
  context.globalAlpha = opacity;
  context.translate(x, y + boxHeight / 2 + slideOffset);
  context.scale(scale, scale);
  context.translate(-x, -(y + boxHeight / 2));
  if (overlay.backgroundColor !== "transparent") {
    context.fillStyle = overlay.backgroundColor;
    context.fillRect(x - boxWidth / 2, y, boxWidth, boxHeight);
  }
  context.fillStyle = overlay.color;
  lines.forEach((line, index) => context.fillText(line, x, y + padding + index * lineHeight));
  context.restore();
}

function wrapText(context: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  context.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawContain(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number): void {
  const scale = Math.min(width / video.videoWidth, height / video.videoHeight); const drawWidth = video.videoWidth * scale; const drawHeight = video.videoHeight * scale;
  context.drawImage(video, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawAdjustedContain(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number, adjustments: VideoAdjustments): void {
  drawWithVideoAdjustments(context, adjustments, () => drawContain(context, video, x, y, width, height));
}

function drawCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number, panX: number, zoom: number): void {
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight) * zoom; const drawWidth = video.videoWidth * scale; const drawHeight = video.videoHeight * scale;
  context.drawImage(video, x + (width - drawWidth) * (panX / 100), y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawAdjustedCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number, panX: number, zoom: number, adjustments: VideoAdjustments): void {
  drawWithVideoAdjustments(context, adjustments, () => drawCover(context, video, x, y, width, height, panX, zoom));
}

function drawWithVideoAdjustments(context: CanvasRenderingContext2D, adjustments: VideoAdjustments, draw: () => void): void {
  context.save(); context.filter = getVideoAdjustmentsFilter(adjustments); draw(); context.restore();
}
