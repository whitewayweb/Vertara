"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { exportLocalMp4, type ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import { outputPresets, type OutputPreset } from "@/features/project/output-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";

interface ExportPanelProps {
  canvasLayout: CanvasLayout; focusLayout: FocusLayout; mode: ExportLayoutMode; playback: PlaybackSettings; posterLayout: PosterLayout; sourceUrl: string;
}

export function ExportPanel({ canvasLayout, focusLayout, mode, playback, posterLayout, sourceUrl }: ExportPanelProps) {
  const [preset, setPreset] = useState<OutputPreset>("instagram-reels");
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<string>();
  async function handleExport() {
    setError(undefined); setProgress(0);
    try {
      const file = await exportLocalMp4({ canvasLayout, focusLayout, mode, onProgress: setProgress, output: outputPresets[preset], playback, posterLayout, sourceUrl });
      const downloadUrl = URL.createObjectURL(file); const link = document.createElement("a"); link.href = downloadUrl; link.download = "vertara-portrait.mp4"; link.click(); URL.revokeObjectURL(downloadUrl);
      setProgress(undefined);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Export failed. Please try again."); setProgress(undefined); }
  }
  return <aside aria-labelledby="export-title" className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Export for</p><h2 className="font-semibold" id="export-title">Choose a destination</h2><div className="mt-4 grid gap-2">{Object.values(outputPresets).map((option) => <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5" key={option.preset}><input checked={preset === option.preset} className="mt-1" name="preset" onChange={() => setPreset(option.preset)} type="radio" /><span><span className="block font-medium">{option.destination}</span><span className="block text-xs text-muted-foreground">{option.description} · {option.label}</span></span></label>)}</div><p className="mt-4 text-xs text-muted-foreground">All exports remain local to this device. Audio muxing is the next compatibility step.</p>{progress !== undefined ? <p aria-live="polite" className="mt-3 text-sm">Rendering {Math.round(progress * 100)}%</p> : null}{error ? <p aria-live="polite" className="mt-3 text-sm text-destructive">{error}</p> : null}<Button className="mt-4 w-full" disabled={progress !== undefined} onClick={handleExport}>{progress === undefined ? `Export for ${outputPresets[preset].destination}` : "Rendering…"}</Button></aside>;
}
