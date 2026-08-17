export type SupportedVideoFormat = "mp4" | "webm" | "mov";

export type AudioAvailability = "available" | "unavailable" | "unknown";

export interface MediaDescriptor {
  name: string;
  format: SupportedVideoFormat;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: number;
  hasVideo: true;
  hasAudio: AudioAvailability;
}

type MediaInspectionErrorCode =
  | "unsupported-file"
  | "unsupported-codec"
  | "invalid-metadata"
  | "metadata-load-failed";

interface MediaInspectionError {
  code: MediaInspectionErrorCode;
  message: string;
}

export type MediaInspectionResult =
  | { ok: true; media: MediaDescriptor }
  | { ok: false; error: MediaInspectionError };
