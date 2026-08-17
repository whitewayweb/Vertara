import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(projectDirectory, "node_modules/@ffmpeg/core/dist/umd");
const outputDirectory = resolve(projectDirectory, "public/ffmpeg");

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  cp(resolve(sourceDirectory, "ffmpeg-core.js"), resolve(outputDirectory, "ffmpeg-core.js")),
  cp(resolve(sourceDirectory, "ffmpeg-core.wasm"), resolve(outputDirectory, "ffmpeg-core.wasm")),
]);
