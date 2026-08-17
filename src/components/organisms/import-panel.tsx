"use client";

import { useEffect, useState } from "react";

import { VideoDropzone } from "@/components/molecules/video-dropzone";
import { inspectMediaFile } from "@/features/media/inspect-media";
import type { MediaInspectionResult } from "@/features/media/media.types";

import { MediaSummary } from "./media-summary";
import { LayoutEditor } from "./layout-editor";

export function ImportPanel() {
  const [result, setResult] = useState<MediaInspectionResult>();
  const [isInspecting, setIsInspecting] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string>();

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  async function handleFileSelected(file: File) {
    setIsInspecting(true);
    setResult(undefined);

    const inspectionResult = await inspectMediaFile(file);
    setResult(inspectionResult);
    setSourceUrl(inspectionResult.ok ? URL.createObjectURL(file) : undefined);
    setIsInspecting(false);
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
      <VideoDropzone disabled={isInspecting} onFileSelected={handleFileSelected} />
      {isInspecting ? <p aria-live="polite" className="text-sm text-muted-foreground">Reading metadata…</p> : null}
      {result && !result.ok ? (
        <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {result.error.message}
        </p>
      ) : null}
      {result?.ok ? <MediaSummary media={result.media} /> : null}
      {result?.ok && sourceUrl ? (
        <LayoutEditor durationSeconds={result.media.durationSeconds} key={sourceUrl} sourceUrl={sourceUrl} />
      ) : null}
    </section>
  );
}
