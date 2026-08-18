import type {
  AudioAvailability,
  MediaDescriptor,
  MediaInspectionResult,
  SupportedVideoFormat,
} from "./media.types";

interface VideoMetadataElement
  extends Pick<
    HTMLVideoElement,
    | "duration"
    | "videoHeight"
    | "videoWidth"
    | "muted"
    | "preload"
    | "src"
    | "onerror"
    | "onloadedmetadata"
    | "removeAttribute"
    | "load"
  > {
  audioTracks?: { length: number };
}

interface MediaInspectionDependencies {
  createObjectUrl(file: File): string;
  createVideoElement(): VideoMetadataElement;
  revokeObjectUrl(url: string): void;
}

const formatByExtension = {
  mov: "mov",
  mp4: "mp4",
  webm: "webm",
  m4v: "other",
  mkv: "other",
  avi: "other",
  mpeg: "other",
  mpg: "other",
  mts: "other",
  m2ts: "other",
  ts: "other",
  wmv: "other",
  flv: "other",
  "3gp": "other",
  "3g2": "other",
} as const satisfies Record<string, SupportedVideoFormat>;

const mimeTypesByFormat: Record<SupportedVideoFormat, ReadonlySet<string>> = {
  mov: new Set(["video/quicktime"]),
  mp4: new Set(["video/mp4"]),
  webm: new Set(["video/webm"]),
  other: new Set(),
};

function getFormat(fileName: string): SupportedVideoFormat | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? formatByExtension[extension as keyof typeof formatByExtension] : undefined;
}

export function validateVideoFile(file: Pick<File, "name" | "type">): MediaInspectionResult | undefined {
  const format = getFormat(file.name);
  const hasMatchingMimeType =
    file.type === "" ||
    (format === "other" && file.type.startsWith("video/")) ||
    (format ? mimeTypesByFormat[format].has(file.type) : file.type.startsWith("video/"));

  if (format && hasMatchingMimeType) {
    return undefined;
  }

  return {
    ok: false,
    error: {
      code: "unsupported-file",
      message: "Choose a video file. MP4, WebM, and browser-compatible MOV open directly; other formats can be converted locally.",
    },
  };
}

function getAudioAvailability(video: VideoMetadataElement): AudioAvailability {
  if (!video.audioTracks) {
    return "unknown";
  }

  return video.audioTracks.length > 0 ? "available" : "unavailable";
}

function getUnreadableMediaError(_fileName: string): MediaInspectionResult {
  return {
    ok: false,
    error: {
      code: "unsupported-codec",
      message: "This video needs local conversion before it can be edited.",
    },
  };
}

function createDescriptor(file: File, video: VideoMetadataElement): MediaInspectionResult {
  const format = getFormat(file.name) ?? "other";
  const { duration, videoHeight: height, videoWidth: width } = video;

  if (!Number.isFinite(duration) || duration <= 0 || width <= 0 || height <= 0) {
    return getUnreadableMediaError(file.name);
  }

  const media: MediaDescriptor = {
    name: file.name,
    format,
    mimeType: file.type || "unknown",
    sizeBytes: file.size,
    durationSeconds: duration,
    width,
    height,
    aspectRatio: width / height,
    hasVideo: true,
    hasAudio: getAudioAvailability(video),
  };

  return { ok: true, media };
}

const browserDependencies: MediaInspectionDependencies = {
  createObjectUrl: (file) => URL.createObjectURL(file),
  createVideoElement: () => document.createElement("video"),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
};

export async function inspectMediaFile(
  file: File,
  dependencies: MediaInspectionDependencies = browserDependencies,
): Promise<MediaInspectionResult> {
  const validationError = validateVideoFile(file);
  if (validationError) {
    return validationError;
  }

  const url = dependencies.createObjectUrl(file);
  const video = dependencies.createVideoElement();

  return new Promise((resolve) => {
    const cleanUp = () => {
      video.onerror = null;
      video.onloadedmetadata = null;
      video.removeAttribute("src");
      video.load();
      dependencies.revokeObjectUrl(url);
    };

    video.onerror = () => {
      cleanUp();
      resolve(getUnreadableMediaError(file.name));
    };

    video.onloadedmetadata = () => {
      const result = createDescriptor(file, video);
      cleanUp();
      resolve(result);
    };

    video.muted = true;
    video.preload = "metadata";
    video.src = url;
  });
}
