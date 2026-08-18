"use client";

import { useEffect, useState } from "react";

import { VideoDropzone } from "@/components/molecules/video-dropzone";
import { ExportCapabilityNotice } from "@/components/molecules/export-capability-notice";
import { inspectMediaFile } from "@/features/media/inspect-media";
import type { MediaInspectionResult } from "@/features/media/media.types";

import { MediaSummary } from "./media-summary";
import { LayoutEditor } from "./layout-editor";

export function ImportPanel() {
  const [result, setResult] = useState<MediaInspectionResult>();
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>();
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
    setSourceUrl(undefined);
    setSelectedFileName(file.name);

    const inspectionResult = await inspectMediaFile(file);
    setIsInspecting(false);

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
      <VideoDropzone disabled={isInspecting} onFileSelected={handleFileSelected} />
      {selectedFileName ? (
        <p className="text-sm text-muted-foreground">
          Filename: <span className="font-medium text-foreground">{selectedFileName}</span>
        </p>
      ) : null}
      {isInspecting ? <p aria-live="polite" className="text-sm text-muted-foreground">Reading metadata…</p> : null}
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
