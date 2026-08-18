import { createServer } from "node:http";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

const port = Number.parseInt(process.env.VERTARA_HELPER_PORT ?? "61348", 10);
const maxInputBytes = Number.parseInt(process.env.VERTARA_HELPER_MAX_INPUT_BYTES ?? `${100 * 1024 ** 3}`, 10);
const conversionTimeoutMs = Number.parseInt(process.env.VERTARA_HELPER_TIMEOUT_MS ?? `${4 * 60 * 60 * 1000}`, 10);
const allowedOrigins = (process.env.VERTARA_ALLOWED_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
let isConverting = false;

function setCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) {
    return false;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Vertara-File-Name, X-Vertara-File-Type");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  response.setHeader("Vary", "Origin");
  return true;
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function sanitizeFileName(value) {
  const decoded = typeof value === "string" ? decodeURIComponent(value) : "source";
  return basename(decoded).replaceAll(/[^a-zA-Z0-9._-]/g, "_") || "source";
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, conversionTimeoutMs);
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, stderr });
    });
  });
}

async function hasEncoder(encoder) {
  try {
    const result = await run("ffmpeg", ["-hide_banner", "-encoders"]);
    return result.code === 0 && new RegExp(`\\s${encoder}(?:\\s|$)`).test(result.stderr);
  } catch {
    return false;
  }
}

async function selectHardwareEncoder() {
  if (process.env.VERTARA_VIDEO_ENCODER) {
    return process.env.VERTARA_VIDEO_ENCODER;
  }

  const candidates = process.platform === "darwin" ? ["h264_videotoolbox"] : ["h264_nvenc", "h264_qsv", "h264_vaapi"];
  for (const candidate of candidates) {
    if (await hasEncoder(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function conversionArgs(inputPath, outputPath, encoder) {
  const videoArgs =
    encoder === "libx264"
      ? ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"]
      : ["-c:v", encoder, "-b:v", process.env.VERTARA_VIDEO_BITRATE ?? "12M"];

  return [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    ...videoArgs,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    outputPath,
  ];
}

async function convert(inputPath, outputPath) {
  const hardwareEncoder = await selectHardwareEncoder();
  if (hardwareEncoder) {
    const hardwareResult = await run("ffmpeg", conversionArgs(inputPath, outputPath, hardwareEncoder));
    if (hardwareResult.code === 0) {
      return true;
    }
  }

  const softwareResult = await run("ffmpeg", conversionArgs(inputPath, outputPath, "libx264"));
  return softwareResult.code === 0;
}

const server = createServer(async (request, response) => {
  if (!setCorsHeaders(request, response)) {
    sendJson(response, 403, { error: "This page is not allowed to use the local helper." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/v1/health") {
    sendJson(response, 200, { service: "vertara-native-media-helper", version: 1 });
    return;
  }

  if (request.method !== "POST" || request.url !== "/v1/convert") {
    sendJson(response, 404, { error: "Unknown helper endpoint." });
    return;
  }

  const contentLength = Number(request.headers["content-length"]);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > maxInputBytes) {
    sendJson(response, 413, { error: "The video is empty or exceeds this helper's configured size limit." });
    return;
  }
  if (isConverting) {
    sendJson(response, 429, { error: "The local helper is already converting a video." });
    return;
  }

  isConverting = true;
  let workDirectory;
  try {
    workDirectory = await mkdtemp(join(tmpdir(), "vertara-media-"));
    const inputPath = join(workDirectory, sanitizeFileName(request.headers["x-vertara-file-name"]));
    const outputPath = join(workDirectory, "compatible-video.mp4");
    await pipeline(request, createWriteStream(inputPath, { flags: "wx" }));
    if (!(await convert(inputPath, outputPath))) {
      sendJson(response, 422, { error: "FFmpeg could not convert this video." });
      return;
    }

    const outputStat = await stat(outputPath);
    response.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": outputStat.size,
      "Content-Disposition": 'attachment; filename="compatible-video.mp4"',
    });
    await pipeline(createReadStream(outputPath), response);
  } catch {
    if (!response.headersSent) {
      sendJson(response, 500, { error: "The local conversion did not complete." });
    } else {
      response.destroy();
    }
  } finally {
    isConverting = false;
    if (workDirectory) {
      await rm(workDirectory, { force: true, recursive: true });
    }
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Vertara local media helper listening on http://127.0.0.1:${port}\\n`);
});
