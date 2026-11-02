import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import type { ExportAudio } from "@/features/audio/export-audio";
import { drawExportFrame, prepareExportFrameAssets, type FrameImage } from "@/features/export/draw-export-frame";
import { getBrowserExportCapability } from "@/features/export/export-capabilities";
import { loadVideoElement, releaseVideoElement, seekVideoElement } from "@/features/media/video-element";
import { getKeptSeconds, getSourceSeconds } from "@/features/project/playback-settings";
import type { ProjectRenderState } from "@/features/render/project-render";
import { createBackgroundCompositor } from "@/features/vision/background-compositor";

export interface LocalMp4ExportRequest {
  abortSignal?: AbortSignal;
  audio?: ExportAudio;
  onProgress(progress: number): void;
  project: ProjectRenderState;
  sourceUrl: string;
}

interface AudioTrackPlan {
  encoderConfig: AudioEncoderConfig;
  muxerCodec: "aac" | "opus";
}

export class ExportCancelledError extends Error {
  constructor() {
    super("Export cancelled.");
    this.name = "ExportCancelledError";
  }
}

export async function exportLocalMp4({ abortSignal, audio, onProgress, project, sourceUrl }: LocalMp4ExportRequest): Promise<Blob> {
  throwIfAborted(abortSignal);
  const capability = getBrowserExportCapability();
  if (capability.level === "unsupported") {
    throw new Error(capability.message);
  }

  const { output, playback } = project;
  const video = await loadVideoElement(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser cannot prepare the export canvas.");

  const sourceFps = 30;
  const fps = sourceFps * playback.speed;
  const frameDurationMicroseconds = Math.round(1_000_000 / fps);
  // Keep the same 30fps source samples as a normal-speed export, then encode
  // them at the faster output rate. This shortens duration without dropping
  // frames from Vertara's current fixed-rate renderer.
  const frameCount = Math.max(1, Math.ceil(getKeptSeconds(playback) * sourceFps));
  const audioPlan = audio ? await planAudioTrack(audio) : undefined;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width: canvas.width, height: canvas.height },
    audio: audio && audioPlan ? { codec: audioPlan.muxerCodec, numberOfChannels: audio.channels.length, sampleRate: audio.sampleRate } : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  const encoderConfig: VideoEncoderConfig = {
    codec: getH264CodecForFramerate(fps),
    width: canvas.width,
    height: canvas.height,
    bitrate: 7_000_000 * playback.speed,
    framerate: fps,
  };
  const support = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!support.supported) {
    releaseVideoElement(video);
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
  const compositor = project.background.mode === "off" ? undefined : await createBackgroundCompositor(project.background, 1280);
  const assets = await prepareExportFrameAssets(project);
  const backdrop: FrameImage = { height: video.videoHeight, image: video, width: video.videoWidth };

  try {
    if (audio && audioPlan) await encodeAudioTrack(audio, audioPlan, muxer, abortSignal);

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      throwIfAborted(abortSignal);
      if (encoderError) {
        throw new Error(`The browser encoder stopped: ${encoderError.message}`);
      }

      const outputSeconds = frameIndex / sourceFps / playback.speed;
      const sourceSeconds = getSourceSeconds(outputSeconds, playback);
      await seekVideoElement(video, sourceSeconds);
      throwIfAborted(abortSignal);
      const frameImage = compositor ? compositor.compose(video) : video;
      drawExportFrame(context, { height: video.videoHeight, image: frameImage, width: video.videoWidth }, backdrop, project, assets, sourceSeconds, outputSeconds);
      const frame = new VideoFrame(canvas, {
        duration: frameDurationMicroseconds,
        timestamp: frameIndex * frameDurationMicroseconds,
      });
      encoder.encode(frame, { keyFrame: frameIndex % (fps * 2) === 0 });
      frame.close();

      if (encoder.encodeQueueSize > 2) {
        await encoder.flush();
      }
      onProgress((frameIndex + 1) / frameCount);
    }

    await encoder.flush();
    throwIfAborted(abortSignal);
    if (encoderError) {
      throw new Error(`The browser encoder stopped: ${encoderError.message}`);
    }
    muxer.finalize();
    return new Blob([target.buffer], { type: "video/mp4" });
  } finally {
    if (encoder.state !== "closed") {
      encoder.close();
    }
    compositor?.close();
    releaseVideoElement(video);
  }
}

async function planAudioTrack(audio: ExportAudio): Promise<AudioTrackPlan> {
  if (typeof AudioEncoder === "undefined") throw new Error("This browser cannot add sound to a local MP4. Use a current Chrome or Safari browser, or mute the video to export without sound.");
  const candidates: AudioTrackPlan[] = [
    { encoderConfig: { bitrate: 192_000, codec: "mp4a.40.2", numberOfChannels: audio.channels.length, sampleRate: audio.sampleRate }, muxerCodec: "aac" },
    { encoderConfig: { bitrate: 160_000, codec: "opus", numberOfChannels: audio.channels.length, sampleRate: audio.sampleRate }, muxerCodec: "opus" },
  ];
  for (const candidate of candidates) {
    const support = await AudioEncoder.isConfigSupported(candidate.encoderConfig).catch(() => undefined);
    if (support?.supported) return candidate;
  }
  throw new Error("This browser cannot encode sound for a local MP4. Mute the video to export without sound.");
}

async function encodeAudioTrack(audio: ExportAudio, plan: AudioTrackPlan, muxer: Muxer<ArrayBufferTarget>, abortSignal: AbortSignal | undefined): Promise<void> {
  let audioError: Error | undefined;
  const encoder = new AudioEncoder({
    output: (chunk, metadata) => muxer.addAudioChunk(chunk, metadata),
    error: (error) => {
      audioError = error;
    },
  });
  encoder.configure(plan.encoderConfig);
  const chunkFrames = audio.sampleRate;
  const totalFrames = audio.channels[0].length;
  try {
    for (let start = 0; start < totalFrames; start += chunkFrames) {
      throwIfAborted(abortSignal);
      const frames = Math.min(chunkFrames, totalFrames - start);
      const planar = new Float32Array(frames * audio.channels.length);
      audio.channels.forEach((channel, index) => planar.set(channel.subarray(start, start + frames), index * frames));
      const data = new AudioData({ data: planar, format: "f32-planar", numberOfChannels: audio.channels.length, numberOfFrames: frames, sampleRate: audio.sampleRate, timestamp: Math.round((start / audio.sampleRate) * 1_000_000) });
      encoder.encode(data);
      data.close();
    }
    await encoder.flush();
    if (audioError) throw new Error(`The browser could not encode the sound: ${audioError.message}`);
  } finally {
    if (encoder.state !== "closed") encoder.close();
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
