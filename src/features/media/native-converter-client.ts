"use client";

const nativeHelperUrl = "http://127.0.0.1:61348";

interface NativeHelperHealth {
  service: "vertara-native-media-helper";
  version: 1;
}

function createOutputName(inputName: string): string {
  const baseName = inputName.replace(/\.[^.]+$/, "") || "video";
  return `${baseName}-compatible.mp4`;
}

/**
 * Uses the separately installed local helper. This deliberately targets only
 * loopback, never an application server or a third-party media service.
 */
export async function convertWithNativeHelper(source: File): Promise<File | undefined> {
  try {
    const healthResponse = await fetch(`${nativeHelperUrl}/v1/health`, { cache: "no-store" });
    if (!healthResponse.ok) {
      return undefined;
    }

    const health = (await healthResponse.json()) as NativeHelperHealth;
    if (health.service !== "vertara-native-media-helper" || health.version !== 1) {
      return undefined;
    }

    const response = await fetch(`${nativeHelperUrl}/v1/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Vertara-File-Name": encodeURIComponent(source.name),
        "X-Vertara-File-Type": source.type || "application/octet-stream",
      },
      body: source,
    });
    if (!response.ok) {
      return undefined;
    }

    return new File([await response.blob()], createOutputName(source.name), { type: "video/mp4" });
  } catch {
    return undefined;
  }
}
