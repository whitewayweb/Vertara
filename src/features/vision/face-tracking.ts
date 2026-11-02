import { loadVideoElement, releaseVideoElement, seekVideoElement } from "@/features/media/video-element";
import type { OutputSettings } from "@/features/project/output-settings";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { createFocusTrack, getPanForCenter, type FocusKeyframe } from "@/features/render/focus-track";
import { getFaceDetector, nextVisionTimestamp } from "@/features/vision/mediapipe";

const samplesPerSecond = 3;

/** Watches the clip on this device and returns a smooth crop path that follows the largest face. */
export async function scanFaceTrack(sourceUrl: string, playback: PlaybackSettings, output: OutputSettings, zoom: number, onProgress: (progress: number) => void): Promise<FocusKeyframe[]> {
  const [detector, video] = await Promise.all([getFaceDetector(), loadVideoElement(sourceUrl)]);
  try {
    const sampleCount = Math.max(1, Math.ceil((playback.trimEndSeconds - playback.trimStartSeconds) * samplesPerSecond));
    const samples: Array<{ centerX: number | undefined; timeSeconds: number }> = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const timeSeconds = playback.trimStartSeconds + index / samplesPerSecond;
      await seekVideoElement(video, timeSeconds);
      const { detections } = detector.detectForVideo(video, nextVisionTimestamp());
      const largest = detections.map((detection) => detection.boundingBox).filter((box) => box !== undefined).sort((a, b) => b.width * b.height - a.width * a.height)[0];
      samples.push({ centerX: largest ? (largest.originX + largest.width / 2) / video.videoWidth : undefined, timeSeconds });
      onProgress((index + 1) / sampleCount);
    }
    return createFocusTrack(samples, (centerX) => getPanForCenter(centerX, video.videoWidth, video.videoHeight, output.width, output.height, zoom));
  } finally {
    releaseVideoElement(video);
  }
}
