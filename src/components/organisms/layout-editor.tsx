"use client";

import { useRef, useState } from "react";
import {
  AudioLines,
  Captions,
  Clapperboard,
  ImageIcon,
  LayoutTemplate,
  Pause,
  Play,
  Settings2,
  Volume2,
} from "lucide-react";

import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { EditorPreviewStage } from "@/components/molecules/editor-preview-stage";
import { EditorTimeline } from "@/components/molecules/editor-timeline";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportCancelledError, exportLocalMp4, type ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import type { MediaDescriptor } from "@/features/media/media.types";
import { createHookSettings } from "@/features/project/hook-settings";
import { outputPresets, type OutputPreset } from "@/features/project/output-settings";
import { createPlaybackSettings } from "@/features/project/playback-settings";
import { createCanvasLayout, defaultCanvasLayout } from "@/features/render/canvas-layout";
import { createFocusLayout, defaultFocusLayout } from "@/features/render/focus-layout";
import { defaultPosterLayout } from "@/features/render/poster-layout";
import { formatTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

type InspectorSection = "frame" | "trim" | "hook" | "export";

interface LayoutEditorProps {
  durationSeconds: number;
  media: MediaDescriptor;
  sourceUrl: string;
}

const layoutOptions: Array<{ description: string; mode: ExportLayoutMode; title: string }> = [
  { mode: "canvas", title: "Canvas", description: "Keep the entire landscape frame" },
  { mode: "focus", title: "Focus", description: "Fill the vertical frame" },
  { mode: "poster", title: "Poster", description: "Add a branded story card" },
];

export function LayoutEditor({ durationSeconds, media, sourceUrl }: LayoutEditorProps) {
  const [activeSection, setActiveSection] = useState<InspectorSection>("frame");
  const [canvasLayout, setCanvasLayout] = useState(defaultCanvasLayout);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportError, setExportError] = useState<string>();
  const [exportProgress, setExportProgress] = useState<number>();
  const [focusLayout, setFocusLayout] = useState(defaultFocusLayout);
  const [hook, setHook] = useState(createHookSettings());
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<ExportLayoutMode>("canvas");
  const [playback, setPlayback] = useState(() => createPlaybackSettings(durationSeconds));
  const [posterLayout, setPosterLayout] = useState(defaultPosterLayout);
  const [preset, setPreset] = useState<OutputPreset>("youtube-shorts");
  const [seekRequest, setSeekRequest] = useState({ id: 0, timeSeconds: 0 });
  const exportAbortController = useRef<AbortController | undefined>(undefined);

  function updatePlayback(partial: Partial<typeof playback>) {
    const nextPlayback = createPlaybackSettings(durationSeconds, { ...playback, ...partial });
    setPlayback(nextPlayback);
    setCurrentTime((time) => Math.min(Math.max(time, nextPlayback.trimStartSeconds), nextPlayback.trimEndSeconds));
  }

  function seekTo(timeSeconds: number) {
    const clampedTime = Math.min(Math.max(timeSeconds, playback.trimStartSeconds), playback.trimEndSeconds);
    setCurrentTime(clampedTime);
    setSeekRequest((request) => ({ id: request.id + 1, timeSeconds: clampedTime }));
  }

  async function handleExport() {
    setExportError(undefined);
    setExportProgress(0);
    const abortController = new AbortController();
    exportAbortController.current = abortController;

    try {
      const file = await exportLocalMp4({
        abortSignal: abortController.signal,
        canvasLayout,
        focusLayout,
        hook,
        mode,
        onProgress: setExportProgress,
        output: outputPresets[preset],
        playback,
        posterLayout,
        sourceUrl,
      });
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `vertara-${outputPresets[preset].preset}.mp4`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      if (!(error instanceof ExportCancelledError)) {
        setExportError(error instanceof Error ? error.message : "The local export could not be completed.");
      }
    } finally {
      exportAbortController.current = undefined;
      setExportProgress(undefined);
    }
  }

  return (
    <section className="vertara-workspace dark h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#101216] text-slate-100 shadow-2xl shadow-black/35">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-cyan-400 font-bold text-slate-950">V</div>
          <div><p className="text-sm font-semibold tracking-[0.16em]">VERTARA</p><p className="hidden text-xs text-slate-500 sm:block">Local video workspace</p></div>
        </div>
        {exportProgress === undefined ? (
          <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={handleExport}>Export</Button>
        ) : (
          <Button className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => exportAbortController.current?.abort()} variant="outline">Cancel export · {Math.round(exportProgress * 100)}%</Button>
        )}
      </header>

      <div className="grid h-[calc(100%-4rem)] min-h-0 lg:grid-cols-[13rem_minmax(0,1fr)_25rem]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
          <nav aria-label="Editor tools" className="space-y-1">
            {[
              [Clapperboard, "Media"], [LayoutTemplate, "Layouts"], [Captions, "Captions"], [ImageIcon, "Brand"],
            ].map(([Icon, label], index) => {
              const ToolIcon = Icon as typeof Clapperboard;
              return <Button className={cn("w-full justify-start gap-3", index === 0 && "bg-white/10 text-white hover:bg-white/15")} key={String(label)} variant="ghost"><ToolIcon className="size-4" />{String(label)}</Button>;
            })}
          </nav>
          <div className="mt-8 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm">
            <p className="font-medium text-cyan-100">Private workspace</p>
            <p className="mt-2 truncate text-slate-400" title={media.name}>{media.name}</p>
            <p className="mt-1 text-xs text-slate-500">{media.width} × {media.height} · {formatTime(durationSeconds)}</p>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-2 text-sm text-slate-400"><Settings2 className="size-4" /> Edit preview</div>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{outputPresets[preset].label}</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6 sm:p-8">
            <EditorPreviewStage canvasLayout={canvasLayout} className="aspect-[9/16] h-[min(61vh,39rem)] min-h-80 max-h-full w-auto max-w-full rounded-xl shadow-2xl shadow-black/50" focusLayout={focusLayout} hook={hook} isPlaying={isPlaying} mode={mode} onPlaybackTimeChange={setCurrentTime} playback={playback} posterLayout={posterLayout} seekRequest={seekRequest} sourceUrl={sourceUrl} />
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-5 py-3">
            <Button aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={() => setIsPlaying((playing) => !playing)} size="icon" variant="ghost">{isPlaying ? <Pause /> : <Play />}</Button>
            <span className="font-mono text-sm text-cyan-300">{formatTime(currentTime)} <span className="text-slate-500">/ {formatTime(playback.trimEndSeconds)}</span></span>
            <Button aria-label="Toggle preview sound" onClick={() => updatePlayback({ muted: !playback.muted })} size="icon" variant="ghost"><Volume2 className={cn(playback.muted && "opacity-40")} /></Button>
          </div>
          <EditorTimeline currentTime={currentTime} endSeconds={playback.trimEndSeconds} onSeek={seekTo} startSeconds={playback.trimStartSeconds} totalSeconds={durationSeconds} />
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#12151a]">
          <Accordion className="px-5" onValueChange={(value) => setActiveSection((value[0] ?? "frame") as InspectorSection)} value={[activeSection]}>
            <AccordionItem value="frame">
              <AccordionTrigger className="py-4 text-base text-white hover:no-underline">Frame &amp; focus</AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="grid grid-cols-3 gap-2">
                  {layoutOptions.map((option) => <Button className={cn("h-auto min-h-24 flex-col items-start justify-between whitespace-normal border border-white/10 p-3 text-left", mode === option.mode && "border-cyan-300 bg-cyan-300/10 text-cyan-100")} key={option.mode} onClick={() => setMode(option.mode)} variant="ghost"><span className="font-medium">{option.title}</span><span className="text-xs font-normal text-slate-400">{option.description}</span></Button>)}
                </div>
                {mode === "canvas" ? <div className="mt-5 space-y-4"><EditorRangeControl label="Backdrop blur" max={48} suffix=" px" value={canvasLayout.backdropBlurPixels} onChange={(backdropBlurPixels) => setCanvasLayout(createCanvasLayout(backdropBlurPixels, canvasLayout.backdropOpacity, canvasLayout.dimOpacity))} /><EditorRangeControl label="Backdrop intensity" suffix="%" value={canvasLayout.backdropOpacity * 100} onChange={(backdropOpacity) => setCanvasLayout(createCanvasLayout(canvasLayout.backdropBlurPixels, backdropOpacity / 100, canvasLayout.dimOpacity))} /><EditorRangeControl label="Backdrop dim" max={80} suffix="%" value={canvasLayout.dimOpacity * 100} onChange={(dimOpacity) => setCanvasLayout(createCanvasLayout(canvasLayout.backdropBlurPixels, canvasLayout.backdropOpacity, dimOpacity / 100))} /></div> : null}
                {mode === "focus" ? <div className="mt-5 space-y-4"><EditorRangeControl label="Position" suffix="%" value={focusLayout.panX} onChange={(panX) => setFocusLayout(createFocusLayout(panX, focusLayout.zoom))} /><EditorRangeControl label="Scale" max={2} min={1} step={0.01} suffix="×" value={focusLayout.zoom} onChange={(zoom) => setFocusLayout(createFocusLayout(focusLayout.panX, zoom))} /></div> : null}
                {mode === "poster" ? <div className="mt-5 space-y-3"><Input aria-label="Poster headline" onChange={(event) => setPosterLayout((layout) => ({ ...layout, headline: event.target.value }))} placeholder="Headline" value={posterLayout.headline} /><Input aria-label="Poster subline" onChange={(event) => setPosterLayout((layout) => ({ ...layout, subline: event.target.value }))} placeholder="Supporting line" value={posterLayout.subline} /></div> : null}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="trim">
              <AccordionTrigger className="py-4 text-base text-white hover:no-underline">Trim &amp; audio</AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5"><EditorRangeControl label="Starts at" max={Math.max(0, playback.trimEndSeconds - 0.1)} suffix="" value={playback.trimStartSeconds} onChange={(trimStartSeconds) => updatePlayback({ trimStartSeconds })} /><EditorRangeControl label="Ends at" min={Math.min(durationSeconds, playback.trimStartSeconds + 0.1)} max={durationSeconds} suffix="" value={playback.trimEndSeconds} onChange={(trimEndSeconds) => updatePlayback({ trimEndSeconds })} /><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm font-medium"><Checkbox checked={playback.muted} onCheckedChange={(checked) => updatePlayback({ muted: checked === true })} /> <AudioLines className="size-4 text-slate-400" /> Mute original audio</label></AccordionContent>
            </AccordionItem>
            <AccordionItem value="hook">
              <AccordionTrigger className="py-4 text-base text-white hover:no-underline">Opening hook</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5"><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm font-medium"><Checkbox checked={hook.enabled} onCheckedChange={(checked) => setHook(createHookSettings({ ...hook, enabled: checked === true }))} /> Show intro text</label>{hook.enabled ? <><Input aria-label="Opening hook text" onChange={(event) => setHook(createHookSettings({ ...hook, text: event.target.value }))} placeholder="Make the opening count" value={hook.text} /><EditorRangeControl label="Shown for" max={5} min={0.5} step={0.5} suffix=" s" value={hook.durationSeconds} onChange={(durationSeconds) => setHook(createHookSettings({ ...hook, durationSeconds }))} /></> : <p className="text-xs leading-5 text-slate-500">Add a short message at the beginning of the exported video.</p>}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="export">
              <AccordionTrigger className="py-4 text-base text-white hover:no-underline">Export preset</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-5"><Select onValueChange={(value) => value && setPreset(value)} value={preset}><SelectTrigger className="h-11 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue /></SelectTrigger><SelectContent className="max-h-72 min-w-[22rem] bg-[#1a1e25] text-slate-100">{Object.values(outputPresets).map((option) => <SelectItem className="py-2.5" key={option.preset} value={option.preset}>{option.destination} · {option.label}</SelectItem>)}</SelectContent></Select><p className="text-xs leading-5 text-slate-500">Exports run in this browser and remain on this device.</p>{exportError ? <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-200">{exportError}</p> : null}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>
      </div>
    </section>
  );
}
