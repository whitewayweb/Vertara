"use client";

import { useEffect, useState } from "react";

import { VideoDropzone } from "@/components/molecules/video-dropzone";
import { ExportCapabilityNotice } from "@/components/molecules/export-capability-notice";
import { inspectMediaFile } from "@/features/media/inspect-media";
import { convertWithNativeHelper } from "@/features/media/native-converter-client";
import { convertVideoToCompatibleMp4 } from "@/features/media/transcode-mov";
import type { MediaInspectionResult } from "@/features/media/media.types";

import { MediaSummary } from "./media-summary";
import { LayoutEditor } from "./layout-editor";

export function ImportPanel() {
  const [result, setResult] = useState<MediaInspectionResult>();
  const [isInspecting, setIsInspecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionMode, setConversionMode] = useState<"native" | "browser">();
  const [conversionProgress, setConversionProgress] = useState<number>();
  const [sourceUrl, setSourceUrl] = useState<string>();

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  async function convertAndOpenVideo(file: File) {
    setIsConverting(true);
    setConversionMode("native");
    setConversionProgress(0);
    try {
      const nativeFile = await convertWithNativeHelper(file);
      const compatibleFile =
        nativeFile && (await inspectMediaFile(nativeFile)).ok
          ? nativeFile
          : await convertVideoToCompatibleMp4(
              file,
              ({ percentage }) => {
                setConversionMode("browser");
                setConversionProgress(percentage);
              },
              async (candidate) => (await inspectMediaFile(candidate)).ok,
            );
      const inspectionResult = await inspectMediaFile(compatibleFile);
      setResult(inspectionResult);
      setSourceUrl(inspectionResult.ok ? URL.createObjectURL(compatibleFile) : undefined);
    } catch {
      setResult({
        ok: false,
        error: {
          code: "compatibility-conversion-failed",
          message: "We could not convert this video on this device. Try an H.264 MP4 copy, or install the local FFmpeg helper for wider format support.",
        },
      });
    } finally {
      setIsConverting(false);
      setConversionMode(undefined);
      setConversionProgress(undefined);
    }
  }

  async function handleFileSelected(file: File) {
    setIsInspecting(true);
    setResult(undefined);
    setSourceUrl(undefined);

    const inspectionResult = await inspectMediaFile(file);
    setIsInspecting(false);

    if (!inspectionResult.ok && inspectionResult.error.code === "unsupported-codec") {
      await convertAndOpenVideo(file);
      return;
    }

    setResult(inspectionResult);
    setSourceUrl(inspectionResult.ok ? URL.createObjectURL(file) : undefined);
  }

  return (
    <section aria-labelledby="import-title" className="mx-auto w-full max-w-xl space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Local-only editor</p>
        <h1 className="text-3xl font-semibold tracking-tight" id="import-title">
          Import your video
        </h1>
        <p className="text-muted-foreground">Your video stays on this device.</p>
      </div>
      <ExportCapabilityNotice />
      <VideoDropzone disabled={isInspecting || isConverting} onFileSelected={handleFileSelected} />
      {isInspecting ? <p aria-live="polite" className="text-sm text-muted-foreground">Reading metadata…</p> : null}
      {isConverting ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {conversionMode === "native" ? "Using the installed local video converter" : "Converting in this browser"}
          {conversionProgress !== undefined ? `… ${conversionProgress}%` : "…"}
        </p>
      ) : null}
      {result && !result.ok ? (
        <div aria-live="polite" className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p>{result.error.message}</p>
        </div>
      ) : null}
      {result?.ok ? <MediaSummary media={result.media} /> : null}
      {result?.ok && sourceUrl ? (
        <LayoutEditor durationSeconds={result.media.durationSeconds} key={sourceUrl} sourceUrl={sourceUrl} />
      ) : null}
    </section>
  );
}
