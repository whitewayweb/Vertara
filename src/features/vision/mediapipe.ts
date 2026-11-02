import type { FaceDetector, ImageSegmenter } from "@mediapipe/tasks-vision";

// Model code and weights are downloaded once and cached by the browser. Video frames are processed here and never sent anywhere.
const wasmUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm";
const faceModelUrl = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const segmenterModelUrl = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite";

let faceDetector: Promise<FaceDetector> | undefined;
let segmenter: Promise<ImageSegmenter> | undefined;

async function withGpuFallback<T>(create: (delegate: "CPU" | "GPU") => Promise<T>): Promise<T> {
  try { return await create("GPU"); } catch { return create("CPU"); }
}

export function getFaceDetector(): Promise<FaceDetector> {
  faceDetector ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(wasmUrl);
    return withGpuFallback((delegate) => FaceDetector.createFromOptions(fileset, { baseOptions: { delegate, modelAssetPath: faceModelUrl }, runningMode: "VIDEO" }));
  })().catch((error: unknown) => { faceDetector = undefined; throw error; });
  return faceDetector;
}

export function getSegmenter(): Promise<ImageSegmenter> {
  segmenter ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(wasmUrl);
    return withGpuFallback((delegate) => ImageSegmenter.createFromOptions(fileset, { baseOptions: { delegate, modelAssetPath: segmenterModelUrl }, outputCategoryMask: false, outputConfidenceMasks: true, runningMode: "VIDEO" }));
  })().catch((error: unknown) => { segmenter = undefined; throw error; });
  return segmenter;
}

let lastTimestamp = 0;

/** MediaPipe's video mode requires strictly increasing timestamps, across preview and export alike. */
export function nextVisionTimestamp(): number {
  lastTimestamp = Math.max(lastTimestamp + 1, performance.now());
  return lastTimestamp;
}
