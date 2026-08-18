"use client";

import { useEffect, useState } from "react";

import { VideoDropzone } from "@/components/molecules/video-dropzone";
import { ExportCapabilityNotice } from "@/components/molecules/export-capability-notice";
import { inspectMediaFile } from "@/features/media/inspect-media";
import type { MediaInspectionResult } from "@/features/media/media.types";

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
    <section aria-labelledby="import-title" className="mx-auto w-full max-w-[110rem] space-y-5">
      {!result?.ok ? <div className="mx-auto max-w-2xl py-12 text-slate-100 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">VERTARA / VIDEO EDITOR</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl" id="import-title">Frame your story<br /><span className="text-slate-500">for every screen.</span></h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">Bring a video into a focused editing workspace. Your source media stays private on this device.</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#13171e] p-2 shadow-2xl shadow-black/30"><VideoDropzone disabled={isInspecting} onFileSelected={handleFileSelected} /></div>
        <div className="mt-4"><ExportCapabilityNotice /></div>
      </div> : null}
      {selectedFileName ? (
        <p className="text-sm text-slate-400">
          Filename: <span className="font-medium text-slate-200">{selectedFileName}</span>
        </p>
      ) : null}
      {isInspecting ? <p aria-live="polite" className="text-sm text-slate-400">Reading metadata…</p> : null}
      {result && !result.ok ? (
        <div aria-live="polite" className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <p>{result.error.message}</p>
        </div>
      ) : null}
      {result?.ok && sourceUrl ? (
        <LayoutEditor durationSeconds={result.media.durationSeconds} key={sourceUrl} media={result.media} sourceUrl={sourceUrl} />
      ) : null}
    </section>
  );
}
