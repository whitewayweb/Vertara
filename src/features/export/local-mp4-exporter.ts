import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import { getBrowserExportCapability } from "@/features/export/export-capabilities";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { HookSettings } from "@/features/project/hook-settings";
import type { OutputSettings } from "@/features/project/output-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";

export type ExportLayoutMode = "canvas" | "focus" | "poster";

export interface LocalMp4ExportRequest {
  abortSignal?: AbortSignal;
  canvasLayout: CanvasLayout;
  focusLayout: FocusLayout;
  hook: HookSettings;
  mode: ExportLayoutMode;
  onProgress(progress: number): void;
  output: OutputSettings;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  sourceUrl: string;
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

  const fps = 30;
  const frameDurationMicroseconds = Math.round(1_000_000 / fps);
  const frameCount = Math.max(1, Math.ceil((request.playback.trimEndSeconds - request.playback.trimStartSeconds) * fps));
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width: canvas.width, height: canvas.height },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  const encoderConfig: VideoEncoderConfig = {
    // Baseline Level 4.0 supports a 1080 × 1920, 30fps vertical export.
    // Level 3.1 closes the encoder when asked to encode this resolution.
    codec: "avc1.420028",
    width: canvas.width,
    height: canvas.height,
    bitrate: 7_000_000,
    framerate: fps,
  };
  const support = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!support.supported) {
    video.remove();
    throw new Error("This browser cannot encode the selected export size as H.264 MP4.");
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

      await seek(video, request.playback.trimStartSeconds + frameIndex / fps);
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
    drawContain(context, video, width * 0.06, height * 0.28, width * 0.88, height * 0.62);
    drawHook(context, request.hook, video.currentTime - request.playback.trimStartSeconds, width, height);
    return;
  }
  if (request.mode === "focus") {
    drawCover(context, video, 0, 0, width, height, request.focusLayout.panX, request.focusLayout.zoom);
    drawHook(context, request.hook, video.currentTime - request.playback.trimStartSeconds, width, height);
    return;
  }
  context.save(); context.filter = `blur(${request.canvasLayout.backdropBlurPixels}px)`; context.globalAlpha = request.canvasLayout.backdropOpacity;
  drawCover(context, video, 0, 0, width, height, 50, 1.1); context.restore();
  context.fillStyle = `rgba(0,0,0,${request.canvasLayout.dimOpacity})`; context.fillRect(0, 0, width, height);
  drawContain(context, video, 0, 0, width, height);
  drawHook(context, request.hook, video.currentTime - request.playback.trimStartSeconds, width, height);
}

function drawHook(
  context: CanvasRenderingContext2D,
  hook: HookSettings,
  elapsedSeconds: number,
  width: number,
  height: number,
): void {
  if (!hook.enabled || !hook.text.trim() || elapsedSeconds >= hook.durationSeconds) return;

  const fontSize = Math.round(width * (hook.fontSizePercent / 100));
  const maxWidth = width * 0.86;
  const lines = wrapText(context, hook.text.trim(), `800 ${fontSize}px sans-serif`, maxWidth);
  const lineHeight = Math.round(fontSize * 1.2);
  const textHeight = lines.length * lineHeight;
  const y = hook.position === "top" ? height * 0.09 : hook.position === "center" ? (height - textHeight) / 2 : height * 0.91 - textHeight;

  context.save();
  context.font = `800 ${fontSize}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = hook.backgroundColor;
  context.fillRect(width * 0.055, y - fontSize * 0.18, width * 0.89, textHeight + fontSize * 0.36);
  context.fillStyle = "white";
  lines.forEach((line, index) => context.fillText(line, width / 2, y + index * lineHeight));
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

function drawCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number, panX: number, zoom: number): void {
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight) * zoom; const drawWidth = video.videoWidth * scale; const drawHeight = video.videoHeight * scale;
  context.drawImage(video, x + (width - drawWidth) * (panX / 100), y + (height - drawHeight) / 2, drawWidth, drawHeight);
}
