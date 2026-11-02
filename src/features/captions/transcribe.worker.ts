import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

import type { TranscribeRequest, TranscribeResponse, WorkerChunk } from "./transcribe";

env.allowLocalModels = false;

const modelId = "onnx-community/whisper-base_timestamped";
let transcriber: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

function post(message: TranscribeResponse) {
  self.postMessage(message);
}

self.onmessage = async ({ data }: MessageEvent<TranscribeRequest>) => {
  try {
    const fileProgress = new Map<string, { loaded: number; total: number }>();
    transcriber ??= pipeline("automatic-speech-recognition", modelId, {
      dtype: "q8",
      progress_callback: (event) => {
        if (event.status !== "progress") return;
        fileProgress.set(event.file, { loaded: event.loaded, total: event.total });
        const files = [...fileProgress.values()];
        post({ progress: files.reduce((sum, file) => sum + file.loaded, 0) / Math.max(1, files.reduce((sum, file) => sum + file.total, 0)), type: "downloading" });
      },
    }) as Promise<AutomaticSpeechRecognitionPipeline>;
    const model = await transcriber;
    post({ type: "listening" });
    const result = await model(data.samples, { chunk_length_s: 30, language: data.language, return_timestamps: "word", stride_length_s: 5, task: "transcribe" });
    const chunks = (Array.isArray(result) ? result[0] : result).chunks as WorkerChunk[] | undefined;
    post({ chunks: chunks ?? [], type: "done" });
  } catch (error) {
    transcriber = undefined;
    post({ message: error instanceof Error ? error.message : "Captions could not be created.", type: "error" });
  }
};
