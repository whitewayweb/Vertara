import type { TranscriptWord } from "@/features/captions/captions";

export interface TranscribeRequest {
  language?: string;
  samples: Float32Array;
}
export interface WorkerChunk {
  text: string;
  timestamp: [number, number | null];
}
export type TranscribeResponse =
  | { progress: number; type: "downloading" }
  | { type: "listening" }
  | { chunks: WorkerChunk[]; type: "done" }
  | { message: string; type: "error" };
export type TranscribeStatus = { progress: number; type: "downloading" } | { type: "listening" };

export const whisperSampleRate = 16_000;
const maximumWordSeconds = 1.5;

export function chunksToWords(chunks: WorkerChunk[]): TranscriptWord[] {
  return chunks
    .map((chunk, index) => {
      const startSeconds = chunk.timestamp[0];
      // Recognised words can claim a whole following pause, which would keep captions on screen through it.
      return { endSeconds: Math.min(chunk.timestamp[1] ?? startSeconds + 0.3, startSeconds + maximumWordSeconds), id: `word-${index}`, startSeconds, text: chunk.text.trim() };
    })
    .filter((word) => word.text.length > 0 && word.endSeconds > word.startSeconds);
}

/** Runs speech recognition in a worker, on this device, so the editor stays responsive. */
export function transcribeOnDevice(samples: Float32Array, language: string | undefined, onStatus: (status: TranscribeStatus) => void): { cancel(): void; result: Promise<TranscriptWord[]> } {
  const worker = new Worker(new URL("./transcribe.worker.ts", import.meta.url), { type: "module" });
  let rejectResult: (reason: Error) => void = () => undefined;
  const result = new Promise<TranscriptWord[]>((resolve, reject) => {
    rejectResult = reject;
    worker.onerror = (event) => reject(new Error(event.message || "Captions could not be created."));
    worker.onmessage = ({ data }: MessageEvent<TranscribeResponse>) => {
      if (data.type === "done") resolve(chunksToWords(data.chunks));
      else if (data.type === "error") reject(new Error(data.message));
      else onStatus(data);
    };
    worker.postMessage({ language, samples } satisfies TranscribeRequest, [samples.buffer]);
  }).finally(() => worker.terminate());
  return { cancel: () => { worker.terminate(); rejectResult(new DOMException("Cancelled", "AbortError")); }, result };
}
