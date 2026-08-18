"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ExportCancelledError,
  exportLocalMp4,
  type ExportLayoutMode,
} from "@/features/export/local-mp4-exporter";
import type { PlaybackSettings } from "@/features/project/playback-settings";
import type { HookSettings } from "@/features/project/hook-settings";
import { outputPresets, type OutputPreset } from "@/features/project/output-settings";
import type { CanvasLayout } from "@/features/render/canvas-layout";
import type { FocusLayout } from "@/features/render/focus-layout";
import type { PosterLayout } from "@/features/render/poster-layout";

interface ExportPanelProps {
  canvasLayout: CanvasLayout;
  focusLayout: FocusLayout;
  hook: HookSettings;
  mode: ExportLayoutMode;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  sourceUrl: string;
}

const exportOptions = Object.values(outputPresets);

export function ExportPanel({
  canvasLayout,
  focusLayout,
  hook,
  mode,
  playback,
  posterLayout,
  sourceUrl,
}: ExportPanelProps) {
  const [preset, setPreset] = useState<OutputPreset>("youtube-shorts");
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<string>();
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  async function handleExport() {
    setError(undefined);
    setProgress(0);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const file = await exportLocalMp4({
        abortSignal: abortController.signal,
        canvasLayout,
        focusLayout,
        hook,
        mode,
        onProgress: setProgress,
        output: outputPresets[preset],
        playback,
        posterLayout,
        sourceUrl,
      });
      downloadFile(file);
      setProgress(undefined);
    } catch (caughtError) {
      if (!(caughtError instanceof ExportCancelledError)) {
        setError(caughtError instanceof Error ? caughtError.message : "Export failed. Please try again.");
      }
      setProgress(undefined);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = undefined;
      }
    }
  }

  const isExporting = progress !== undefined;

  return (
    <aside aria-labelledby="export-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">Export for</p>
      <h2 className="font-semibold" id="export-title">
        Choose a destination
      </h2>
      <div className="mt-4 grid gap-2">
        {exportOptions.map((option) => (
          <label
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            key={option.preset}
          >
            <input
              checked={preset === option.preset}
              className="mt-1"
              name="preset"
              onChange={() => setPreset(option.preset)}
              type="radio"
            />
            <span>
              <span className="block font-medium">{option.destination}</span>
              <span className="block text-xs text-muted-foreground">
                {option.description} · {option.label}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        All exports remain local to this device. Exported video does not yet include source audio.
      </p>
      {isExporting ? (
        <p aria-live="polite" className="mt-3 text-sm">
          Rendering {Math.round(progress * 100)}%
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button disabled={isExporting} onClick={handleExport}>
          {isExporting ? "Rendering…" : `Export for ${outputPresets[preset].destination}`}
        </Button>
        {isExporting ? (
          <Button onClick={() => abortControllerRef.current?.abort()} type="button" variant="outline">
            Cancel export
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function downloadFile(file: Blob): void {
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "vertara-portrait.mp4";
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
