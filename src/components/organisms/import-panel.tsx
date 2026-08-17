"use client";

import { useEffect, useState } from "react";

import { VideoDropzone } from "@/components/molecules/video-dropzone";
import { inspectMediaFile } from "@/features/media/inspect-media";
import { convertMovToCompatibleMp4 } from "@/features/media/transcode-mov";
import type { MediaInspectionResult } from "@/features/media/media.types";

import { MediaSummary } from "./media-summary";
import { LayoutEditor } from "./layout-editor";

export function ImportPanel() {
  const [result, setResult] = useState<MediaInspectionResult>();
  const [isInspecting, setIsInspecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number>();
  const [sourceUrl, setSourceUrl] = useState<string>();

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  async function convertAndOpenMov(file: File) {
    setIsConverting(true);
    setConversionProgress(0);
    try {
      const compatibleFile = await convertMovToCompatibleMp4(file, ({ percentage }) => {
        setConversionProgress(percentage);
      });
      const inspectionResult = await inspectMediaFile(compatibleFile);
      setResult(inspectionResult);
      setSourceUrl(inspectionResult.ok ? URL.createObjectURL(compatibleFile) : undefined);
    } catch {
      setResult({
        ok: false,
        error: {
          code: "compatibility-conversion-failed",
          message: "We could not convert this MOV on this device. Try exporting an H.264 MP4 copy instead.",
        },
      });
    } finally {
      setIsConverting(false);
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
      await convertAndOpenMov(file);
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
      <VideoDropzone disabled={isInspecting || isConverting} onFileSelected={handleFileSelected} />
      {isInspecting ? <p aria-live="polite" className="text-sm text-muted-foreground">Reading metadata…</p> : null}
      {isConverting ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Converting this MOV on your device{conversionProgress !== undefined ? `… ${conversionProgress}%` : "…"}
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
