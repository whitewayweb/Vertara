"use client";

import { useState } from "react";

import { PlaybackVideo } from "@/components/atoms/playback-video";
import { Button } from "@/components/ui/button";
import { CanvasVideoPreview } from "@/components/molecules/canvas-video-preview";
import { PosterVideoPreview } from "@/components/molecules/poster-video-preview";
import { createPlaybackSettings, type PlaybackSettings } from "@/features/project/playback-settings";
import { createHookSettings, type HookSettings } from "@/features/project/hook-settings";
import { defaultCanvasLayout, type CanvasLayout } from "@/features/render/canvas-layout";
import { defaultFocusLayout, type FocusLayout } from "@/features/render/focus-layout";
import { defaultPosterLayout, type PosterLayout } from "@/features/render/poster-layout";
import { cn } from "@/lib/utils";

import { CanvasEditor } from "./canvas-editor";
import { EditSettingsPanel } from "./edit-settings-panel";
import { ExportPanel } from "./export-panel";
import { FocusEditor } from "./focus-editor";
import { HookSettingsPanel } from "./hook-settings-panel";
import { PosterEditor } from "./poster-editor";

type LayoutMode = "canvas" | "focus" | "poster";

interface LayoutEditorProps {
  durationSeconds: number;
  sourceUrl: string;
}

const layoutOptions: Array<{ description: string; label: string; value: LayoutMode }> = [
  { value: "canvas", label: "Canvas", description: "Full landscape video with a blurred backdrop" },
  { value: "focus", label: "Focus", description: "9:16 crop with pan and zoom" },
  { value: "poster", label: "Poster", description: "A styled title card around the full video" },
];

export function LayoutEditor({ durationSeconds, sourceUrl }: LayoutEditorProps) {
  const [selectedMode, setSelectedMode] = useState<LayoutMode>("canvas");
  const [isSelectionConfirmed, setIsSelectionConfirmed] = useState(false);
  const [playback, setPlayback] = useState(() => createPlaybackSettings(durationSeconds));
  const [hook, setHook] = useState<HookSettings>(() => createHookSettings());
  const [canvasLayout, setCanvasLayout] = useState<CanvasLayout>(defaultCanvasLayout);
  const [focusLayout, setFocusLayout] = useState<FocusLayout>(defaultFocusLayout);
  const [posterLayout, setPosterLayout] = useState<PosterLayout>(defaultPosterLayout);
  const thumbnailPlayback = { ...playback, muted: true };

  if (isSelectionConfirmed) {
    return (
      <section aria-labelledby="selected-layout-title" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Selected layout</p>
            <h2 className="font-semibold" id="selected-layout-title">
              {layoutOptions.find((option) => option.value === selectedMode)?.label}
            </h2>
          </div>
          <Button onClick={() => setIsSelectionConfirmed(false)} variant="outline">
            Compare layouts
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <SelectedLayoutEditor
            canvasLayout={canvasLayout}
            focusLayout={focusLayout}
            hook={hook}
            mode={selectedMode}
            onCanvasLayoutChange={setCanvasLayout}
            onFocusLayoutChange={setFocusLayout}
            onPosterLayoutChange={setPosterLayout}
            playback={playback}
            posterLayout={posterLayout}
            sourceUrl={sourceUrl}
          />
          <div className="space-y-4">
            <EditSettingsPanel durationSeconds={durationSeconds} onChange={(nextSettings) => setPlayback(createPlaybackSettings(durationSeconds, nextSettings))} settings={playback} />
            <HookSettingsPanel onChange={(nextSettings) => setHook(createHookSettings(nextSettings))} settings={hook} />
            <ExportPanel canvasLayout={canvasLayout} focusLayout={focusLayout} hook={hook} mode={selectedMode} playback={playback} posterLayout={posterLayout} sourceUrl={sourceUrl} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="layout-editor-title" className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Layout previews</p>
        <h2 className="font-semibold" id="layout-editor-title">Compare your output styles</h2>
      </div>
      <div aria-label="Output layout" className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup">
        {layoutOptions.map((option) => (
          <button
            aria-checked={selectedMode === option.value}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              selectedMode === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/60",
            )}
            key={option.value}
            onClick={() => setSelectedMode(option.value)}
            role="radio"
            type="button"
          >
            <LayoutThumbnail mode={option.value} playback={thumbnailPlayback} sourceUrl={sourceUrl} />
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
          </button>
        ))}
      </div>
      <Button className="w-full" onClick={() => setIsSelectionConfirmed(true)}>
        Continue with {layoutOptions.find((option) => option.value === selectedMode)?.label}
      </Button>
    </section>
  );
}

interface LayoutThumbnailProps {
  mode: LayoutMode;
  playback: PlaybackSettings;
  sourceUrl: string;
}

function LayoutThumbnail({ mode, playback, sourceUrl }: LayoutThumbnailProps) {
  if (mode === "focus") {
    return (
      <div className="mb-3 aspect-[9/16] overflow-hidden rounded-md bg-black">
        <PlaybackVideo ariaHidden className="h-full w-full object-cover" playback={playback} sourceUrl={sourceUrl} />
      </div>
    );
  }

  if (mode === "poster") {
    return (
      <PosterVideoPreview
        className="mb-3 aspect-[9/16] rounded-md"
        headline="A story worth sharing"
        playback={playback}
        sourceUrl={sourceUrl}
        subline="Made for the vertical screen"
      />
    );
  }

  return <CanvasVideoPreview className="mb-3 aspect-[9/16] rounded-md" playback={playback} sourceUrl={sourceUrl} />;
}

interface SelectedLayoutEditorProps {
  canvasLayout: CanvasLayout;
  focusLayout: FocusLayout;
  hook: HookSettings;
  mode: LayoutMode;
  onCanvasLayoutChange(layout: CanvasLayout): void;
  onFocusLayoutChange(layout: FocusLayout): void;
  onPosterLayoutChange(layout: PosterLayout): void;
  playback: PlaybackSettings;
  posterLayout: PosterLayout;
  sourceUrl: string;
}

function SelectedLayoutEditor({
  canvasLayout,
  focusLayout,
  hook,
  mode,
  onCanvasLayoutChange,
  onFocusLayoutChange,
  onPosterLayoutChange,
  playback,
  posterLayout,
  sourceUrl,
}: SelectedLayoutEditorProps) {
  if (mode === "canvas") {
    return <CanvasEditor hook={hook} layout={canvasLayout} onChange={onCanvasLayoutChange} playback={playback} sourceUrl={sourceUrl} />;
  }

  if (mode === "focus") {
    return <FocusEditor hook={hook} layout={focusLayout} onChange={onFocusLayoutChange} playback={playback} sourceUrl={sourceUrl} />;
  }

  return <PosterEditor hook={hook} layout={posterLayout} onChange={onPosterLayoutChange} playback={playback} sourceUrl={sourceUrl} />;
}
