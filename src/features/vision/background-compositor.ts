import type { BackgroundSettings } from "@/features/render/project-render";
import { getSegmenter, nextVisionTimestamp } from "@/features/vision/mediapipe";

export interface BackgroundCompositor {
  close(): void;
  compose(video: HTMLVideoElement): HTMLCanvasElement;
  readonly canvas: HTMLCanvasElement;
}

/** Keeps the person and replaces everything behind them, one frame at a time. */
export async function createBackgroundCompositor(settings: BackgroundSettings, maximumWidth: number, canvas = document.createElement("canvas")): Promise<BackgroundCompositor> {
  const segmenter = await getSegmenter();
  const context = canvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const maskContext = maskCanvas.getContext("2d");
  if (!context || !maskContext) throw new Error("This browser cannot prepare background removal.");

  return {
    canvas,
    close() { maskCanvas.width = 0; },
    compose(video) {
      const scale = Math.min(1, maximumWidth / video.videoWidth);
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }

      const result = segmenter.segmentForVideo(video, nextVisionTimestamp());
      const masks = result.confidenceMasks ?? [];
      // The selfie model reports background first and person last.
      const mask = masks.at(-1);
      if (mask) {
        const confidence = mask.getAsFloat32Array();
        const pixels = new ImageData(mask.width, mask.height);
        for (let index = 0; index < confidence.length; index += 1) {
          // A soft ramp avoids a hard cut-out edge around hair and shoulders.
          pixels.data[index * 4 + 3] = Math.min(255, Math.max(0, (confidence[index] - 0.35) * 850));
        }
        maskCanvas.width = mask.width;
        maskCanvas.height = mask.height;
        maskContext.putImageData(pixels, 0, 0);
      }
      masks.forEach((item) => item.close());

      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, width, height);
      context.drawImage(video, 0, 0, width, height);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(maskCanvas, 0, 0, width, height);
      context.globalCompositeOperation = "destination-over";
      if (settings.mode === "blur") {
        context.filter = `blur(${Math.round(width * 0.025)}px)`;
        context.drawImage(video, 0, 0, width, height);
        context.filter = "none";
      } else {
        context.fillStyle = settings.color;
        context.fillRect(0, 0, width, height);
      }
      return canvas;
    },
  };
}
