"use client";

export interface CompatibilityConversionProgress {
  percentage: number;
}

const inputFileName = "source.mov";
const outputFileName = "compatible-video.mp4";

function createOutputFileName(inputName: string): string {
  const baseName = inputName.replace(/\.[^.]+$/, "") || "video";
  return `${baseName}-compatible.mp4`;
}

function isBinaryFile(data: Uint8Array | string): data is Uint8Array {
  return data instanceof Uint8Array;
}

/**
 * Converts a browser-unreadable MOV to an H.264/AAC MP4 in a Web Worker.
 * No source media leaves the browser.
 */
export async function convertMovToCompatibleMp4(
  source: File,
  onProgress: (progress: CompatibilityConversionProgress) => void,
): Promise<File> {
  const [{ FFmpeg }, { fetchFile }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    onProgress({ percentage: Math.min(100, Math.max(0, Math.round(progress * 100))) });
  });

  try {
    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });
    await ffmpeg.writeFile(inputFileName, await fetchFile(source));

    const exitCode = await ffmpeg.exec([
      "-i",
      inputFileName,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
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

    const fileBytes = new Uint8Array(output.byteLength);
    fileBytes.set(output);

    onProgress({ percentage: 100 });
    return new File([fileBytes.buffer], createOutputFileName(source.name), { type: "video/mp4" });
  } finally {
    ffmpeg.terminate();
  }
}
