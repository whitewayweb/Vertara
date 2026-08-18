type ExportCapabilityLevel = "ready" | "limited" | "unsupported";

export interface ExportCapability {
  level: ExportCapabilityLevel;
  message: string;
}

export interface ExportCapabilityEnvironment {
  hardwareConcurrency?: number;
  supportsVideoEncoder: boolean;
  supportsVideoFrame: boolean;
}

let browserCapability: ExportCapability | undefined;

export function assessExportCapability(
  environment: ExportCapabilityEnvironment,
): ExportCapability {
  if (!environment.supportsVideoEncoder || !environment.supportsVideoFrame) {
    return {
      level: "unsupported",
      message:
        "This browser cannot create a local MP4 export. Use a current Chrome or Safari browser.",
    };
  }

  if (
    environment.hardwareConcurrency !== undefined &&
    environment.hardwareConcurrency <= 4
  ) {
    return {
      level: "limited",
      message:
        "This device may need more time to export. Shorter clips or a lower-resolution preset will be more reliable.",
    };
  }

  return {
    level: "ready",
    message: "This browser can prepare a local MP4 export.",
  };
}

export function getBrowserExportCapability(): ExportCapability {
  browserCapability ??= assessExportCapability({
    hardwareConcurrency: navigator.hardwareConcurrency,
    supportsVideoEncoder: "VideoEncoder" in window,
    supportsVideoFrame: "VideoFrame" in window,
  });

  return browserCapability;
}
