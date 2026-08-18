"use client";

export interface CompatibilityConversionProgress {
  percentage: number;
}

export type BrowserCompatibilityCheck = (file: File) => Promise<boolean>;

const inputFileName = "source.mov";
const outputFileName = "compatible-video.mp4";

function createOutputFileName(inputName: string): string {
  const baseName = inputName.replace(/\.[^.]+$/, "") || "video";
  return `${baseName}-compatible.mp4`;
}

function isBinaryFile(data: Uint8Array | string): data is Uint8Array {
  return data instanceof Uint8Array;
}

function createCompatibleFile(data: Uint8Array, sourceName: string): File {
  const fileBytes = new Uint8Array(data.byteLength);
  fileBytes.set(data);
  return new File([fileBytes.buffer], createOutputFileName(sourceName), { type: "video/mp4" });
}

export function supportsMultiThreadedWasm(): boolean {
  return globalThis.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
}

/**
 * Produces a browser-compatible H.264/AAC MP4 in a Web Worker.
 * A stream-copy remux is attempted first so already-compatible codecs avoid
 * an expensive re-encode. No source media leaves the browser.
 */
export async function convertVideoToCompatibleMp4(
  source: File,
  onProgress: (progress: CompatibilityConversionProgress) => void,
  isBrowserCompatible: BrowserCompatibilityCheck,
): Promise<File> {
  const [{ FFmpeg }, { fetchFile }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  let isFullTranscode = false;

  ffmpeg.on("progress", ({ progress }) => {
    if (isFullTranscode) {
      onProgress({ percentage: Math.min(100, Math.max(0, Math.round(progress * 100))) });
    }
  });

  try {
    const useMultiThreadedCore = supportsMultiThreadedWasm();
    await ffmpeg.load(
      useMultiThreadedCore
        ? {
            coreURL: "/ffmpeg/ffmpeg-core-mt.js",
            wasmURL: "/ffmpeg/ffmpeg-core-mt.wasm",
            workerURL: "/ffmpeg/ffmpeg-core-mt.worker.js",
          }
        : {
            coreURL: "/ffmpeg/ffmpeg-core.js",
            wasmURL: "/ffmpeg/ffmpeg-core.wasm",
          },
    );
    await ffmpeg.writeFile(inputFileName, await fetchFile(source));

    const remuxExitCode = await ffmpeg.exec([
      "-i",
      inputFileName,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);

    if (remuxExitCode === 0) {
      const remuxedOutput = await ffmpeg.readFile(outputFileName);
      if (isBinaryFile(remuxedOutput)) {
        const remuxedFile = createCompatibleFile(remuxedOutput, source.name);
        if (await isBrowserCompatible(remuxedFile)) {
          onProgress({ percentage: 100 });
          return remuxedFile;
        }
      }
    }

    isFullTranscode = true;
    const exitCode = await ffmpeg.exec([
      "-y",
      "-i",
      inputFileName,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputFileName,
    ]);

    if (exitCode !== 0) {
      throw new Error("The MOV could not be converted on this device.");
    }

    const output = await ffmpeg.readFile(outputFileName);
    if (!isBinaryFile(output)) {
      throw new Error("The converted video could not be read.");
    }

    onProgress({ percentage: 100 });
    return createCompatibleFile(output, source.name);
  } finally {
    ffmpeg.terminate();
  }
}
