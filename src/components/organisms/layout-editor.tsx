"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Pause,
  Play,
  ScanLine,
  Copy, Redo2, Settings2, Trash2, Type, Undo2,
  SmilePlus,
  Volume2,
} from "lucide-react";

import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { EditorColorPicker } from "@/components/atoms/editor-color-picker";
import { EditorPreviewStage } from "@/components/molecules/editor-preview-stage";
import { EditorTimeline } from "@/components/molecules/editor-timeline";
import { FrameChoiceCard } from "@/components/molecules/frame-choice-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ExportCancelledError, exportLocalMp4, type ExportLayoutMode } from "@/features/export/local-mp4-exporter";
import type { MediaDescriptor } from "@/features/media/media.types";
import { createTextOverlay, duplicateTextOverlay, textAlignmentOptions, textEntranceAnimationOptions, textFontOptions, textOverlayTemplates, type TextOverlay } from "@/features/project/text-overlays";
import { commitEdit, createEditHistory, redoEdit, undoEdit } from "@/features/project/edit-history";
import { outputPresets, type OutputPreset } from "@/features/project/output-settings";
import { createPlaybackSettings, getExportDurationSeconds, playbackSpeeds, type PlaybackSpeed } from "@/features/project/playback-settings";
import { createCanvasLayout, defaultCanvasLayout } from "@/features/render/canvas-layout";
import { createFocusLayout, defaultFocusLayout } from "@/features/render/focus-layout";
import { defaultPosterLayout } from "@/features/render/poster-layout";
import { createVideoAdjustments, defaultVideoAdjustments } from "@/features/render/video-adjustments";
import { formatTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

type InspectorSection = "frame" | "trim" | "export";
type ComposerMode = "frame" | "text";

interface LayoutEditorProps {
  durationSeconds: number;
  media: MediaDescriptor;
  sourceUrl: string;
}

const layoutOptions: Array<{ description: string; mode: ExportLayoutMode; title: string }> = [
  { mode: "canvas", title: "Show the scene", description: "Keep the whole moment visible." },
  { mode: "focus", title: "Fill the frame", description: "Bring the subject closer." },
  { mode: "poster", title: "Lead with a message", description: "Set the context before the video." },
];

interface TextOverlayToolbarProps {
  durationSeconds: number;
  onAdd(): void;
  onAddSticker(sticker: string): void;
  onAddTemplate(template: Partial<TextOverlay>): void;
  onChange(id: string, change: Partial<TextOverlay>): void;
  onDelete(id: string): void;
  onDuplicate(id: string): void;
  onSelect(id: string): void;
  overlays: TextOverlay[];
  selected?: TextOverlay;
}

function TextOverlayToolbar({ durationSeconds, onAdd, onAddSticker, onAddTemplate, onChange, onDelete, onDuplicate, onSelect, overlays, selected }: TextOverlayToolbarProps) {
  return <div className="flex w-full max-w-xl flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#171b22]/95 p-2 shadow-lg" role="toolbar" aria-label="Text editor">
    <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={onAdd} size="sm"><Type /> Add text</Button>
    <div className="flex items-center gap-1" aria-label="Text templates" role="group">{textOverlayTemplates.map((template) => <Button className="h-7 px-2 text-[0.65rem]" key={template.label} onClick={() => onAddTemplate(template)} size="sm" variant="outline">{template.label}</Button>)}</div>
    <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/20 p-1" aria-label="Add emoji sticker" role="group">{["✨", "🔥", "😍", "💯", "🎉"].map((sticker) => <Button aria-label={`Add ${sticker} sticker`} className="size-7 text-base" key={sticker} onClick={() => onAddSticker(sticker)} size="icon-sm" variant="ghost">{sticker}</Button>)}<SmilePlus aria-hidden="true" className="size-3 text-slate-500" /></div>
    {selected ? <>
      <Textarea aria-label="Selected text" className="min-h-8 min-w-32 flex-1 resize-none border-white/10 bg-black/20 py-1 text-white" maxLength={280} onChange={(event) => onChange(selected.id, { text: event.target.value })} placeholder="Write something" rows={1} value={selected.text} />
      <label className="flex items-center gap-1 text-xs text-slate-400">Text <EditorColorPicker label="Text colour" onChange={(color) => onChange(selected.id, { color })} value={selected.color} /></label>
      <label className="flex items-center gap-1 text-xs text-slate-400">Fill <EditorColorPicker label="Text background colour" onChange={(backgroundColor) => onChange(selected.id, { backgroundColor })} value={selected.backgroundColor} /></label>
      <Select onValueChange={(value) => value && onChange(selected.id, { fontFamily: value as TextOverlay["fontFamily"] })} value={selected.fontFamily}><SelectTrigger className="h-8 w-28 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textFontOptions.map((font) => <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>)}</SelectContent></Select>
      <Select onValueChange={(value) => value && onChange(selected.id, { entranceAnimation: value as TextOverlay["entranceAnimation"] })} value={selected.entranceAnimation}><SelectTrigger aria-label="Text entrance" className="h-8 w-24 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textEntranceAnimationOptions.map((animation) => <SelectItem key={animation.value} value={animation.value}>{animation.label}</SelectItem>)}</SelectContent></Select>
      <Select onValueChange={(value) => value && onChange(selected.id, { textAlign: value as TextOverlay["textAlign"] })} value={selected.textAlign}><SelectTrigger aria-label="Text alignment" className="h-8 w-24 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textAlignmentOptions.map((alignment) => <SelectItem key={alignment.value} value={alignment.value}>{alignment.label}</SelectItem>)}</SelectContent></Select>
      <label className="flex items-center gap-1 text-xs text-slate-400">Size <input aria-label="Text size" className="w-16 accent-cyan-300" max="12" min="4" onChange={(event) => onChange(selected.id, { fontSizePercent: Number(event.target.value) })} step="1" type="range" value={selected.fontSizePercent} /></label>
      <label className="flex items-center gap-1 text-xs text-slate-400">From <input aria-label="Text start time" className="w-12 rounded border border-white/10 bg-black/20 px-1 py-0.5 text-white" max={durationSeconds} min="0" onChange={(event) => onChange(selected.id, { startSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.startSeconds} />s</label>
      <label className="flex items-center gap-1 text-xs text-slate-400">For <input aria-label="Text duration" className="w-12 rounded border border-white/10 bg-black/20 px-1 py-0.5 text-white" max={Math.max(0.5, durationSeconds - selected.startSeconds)} min="0.5" onChange={(event) => onChange(selected.id, { durationSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.durationSeconds} />s</label>
      <Button aria-label="Duplicate selected text" className="text-slate-300" onClick={() => onDuplicate(selected.id)} size="icon-sm" variant="ghost"><Copy /></Button><Button aria-label="Delete selected text" className="text-slate-300 hover:bg-red-400/15 hover:text-red-200" onClick={() => onDelete(selected.id)} size="icon-sm" variant="ghost"><Trash2 /></Button>
    </> : <p className="px-1 text-xs text-slate-400">Add a layer, then edit it here or drag it in the preview.</p>}
    {overlays.length > 0 ? <div className="flex w-full gap-1 overflow-x-auto border-t border-white/10 pt-2" aria-label="Text layers" role="list">{overlays.map((overlay, index) => <Button aria-label={`Select layer ${index + 1}`} className={cn("h-7 shrink-0 max-w-32 justify-start truncate px-2 text-xs", overlay.id === selected?.id && "bg-cyan-300/15 text-cyan-100")} key={overlay.id} onClick={() => onSelect(overlay.id)} role="listitem" size="sm" variant="ghost">{overlay.text.trim() || `Text ${index + 1}`}</Button>)}</div> : null}
  </div>;
}

export function LayoutEditor({ durationSeconds, media, sourceUrl }: LayoutEditorProps) {
  const [activeSection, setActiveSection] = useState<InspectorSection>("frame");
  const [canvasLayout, setCanvasLayout] = useState(defaultCanvasLayout);
  const [composerMode, setComposerMode] = useState<ComposerMode>("frame");
  const [currentTime, setCurrentTime] = useState(0);
  const [exportError, setExportError] = useState<string>();
  const [exportProgress, setExportProgress] = useState<number>();
  const [focusLayout, setFocusLayout] = useState(defaultFocusLayout);
  const [overlayHistory, setOverlayHistory] = useState(() => createEditHistory<TextOverlay[]>([]));
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<ExportLayoutMode>("canvas");
  const [playback, setPlayback] = useState(() => createPlaybackSettings(durationSeconds));
  const [posterLayout, setPosterLayout] = useState(defaultPosterLayout);
  const [videoAdjustments, setVideoAdjustments] = useState(defaultVideoAdjustments);
  const [preset, setPreset] = useState<OutputPreset>("youtube-shorts");
  const [seekRequest, setSeekRequest] = useState({ id: 0, timeSeconds: 0 });
  const [showSafeAreaGuides, setShowSafeAreaGuides] = useState(true);
  const exportAbortController = useRef<AbortController | undefined>(undefined);
  const overlays = overlayHistory.present;

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if ((!event.metaKey && !event.ctrlKey) || event.key.toLowerCase() !== "z" || target?.isContentEditable || target?.matches("input, textarea, select")) return;
      event.preventDefault();
      setOverlayHistory((history) => event.shiftKey ? redoEdit(history) : undoEdit(history));
    }
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, []);

  function updatePlayback(partial: Partial<typeof playback>) {
    const nextPlayback = createPlaybackSettings(durationSeconds, { ...playback, ...partial });
    setPlayback(nextPlayback);
    setCurrentTime((time) => Math.min(Math.max(time, nextPlayback.trimStartSeconds), nextPlayback.trimEndSeconds));
  }

  function addOverlay(partial: Partial<TextOverlay> = {}) {
    const overlay = createTextOverlay(`text-${Date.now()}-${overlays.length}`, { durationSeconds: Math.min(2, getExportDurationSeconds(playback)), ...partial });
    setOverlayHistory((history) => commitEdit(history, [...history.present, overlay]));
    setSelectedOverlayId(overlay.id);
    setComposerMode("text");
  }

  function updateOverlays(update: (current: TextOverlay[]) => TextOverlay[]) {
    setOverlayHistory((history) => commitEdit(history, update(history.present)));
  }

  function duplicateOverlay(id: string) {
    const source = overlays.find((overlay) => overlay.id === id);
    if (!source) return;
    const duplicate = duplicateTextOverlay(source, `text-${Date.now()}-${overlays.length}`);
    updateOverlays((current) => [...current, duplicate]);
    setSelectedOverlayId(duplicate.id);
  }

  function seekTo(timeSeconds: number) {
    const clampedTime = Math.min(Math.max(timeSeconds, playback.trimStartSeconds), playback.trimEndSeconds);
    setCurrentTime(clampedTime);
    setSeekRequest((request) => ({ id: request.id + 1, timeSeconds: clampedTime }));
  }

  function selectLayout(nextMode: ExportLayoutMode) {
    setMode(nextMode);
    setActiveSection("frame");
    setComposerMode("text");
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
        overlays,
        mode,
        onProgress: setExportProgress,
        output: outputPresets[preset],
        playback,
        posterLayout,
        sourceUrl,
        videoAdjustments,
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
        <div className="ml-auto mr-3 flex items-center gap-1"><Button aria-label={showSafeAreaGuides ? "Hide safe area guides" : "Show safe area guides"} onClick={() => setShowSafeAreaGuides((visible) => !visible)} size="icon-sm" title="Toggle safe area guides" variant="ghost"><ScanLine className={cn(showSafeAreaGuides && "text-cyan-300")} /></Button><Button aria-label="Undo text edit" disabled={overlayHistory.past.length === 0} onClick={() => setOverlayHistory(undoEdit)} size="icon-sm" title="Undo text edit (⌘Z)" variant="ghost"><Undo2 /></Button><Button aria-label="Redo text edit" disabled={overlayHistory.future.length === 0} onClick={() => setOverlayHistory(redoEdit)} size="icon-sm" title="Redo text edit (⇧⌘Z)" variant="ghost"><Redo2 /></Button></div>
        {exportProgress === undefined ? (
          <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={handleExport}>Export</Button>
        ) : (
          <Button className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => exportAbortController.current?.abort()} variant="outline">Cancel export · {Math.round(exportProgress * 100)}%</Button>
        )}
      </header>

      <div className="grid h-[calc(100%-4rem)] min-h-0 lg:grid-cols-[13rem_minmax(0,1fr)_25rem]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-3">
          <p className="px-2 py-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Your footage</p>
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-sm">
            <p className="font-medium text-cyan-100">Private workspace</p>
            <p className="mt-2 truncate text-slate-400" title={media.name}>{media.name}</p>
            <p className="mt-1 text-xs text-slate-500">{media.width} × {media.height} · {formatTime(durationSeconds)}</p>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-2 text-sm text-slate-400"><Settings2 className="size-4" /> Edit preview</div>
            <div aria-label="Editing controls" className="ml-auto mr-3 flex rounded-lg border border-white/10 bg-black/20 p-0.5" role="group"><Button aria-pressed={composerMode === "frame"} className={cn("h-7 px-2 text-xs", composerMode === "frame" && "bg-white/10 text-white")} onClick={() => setComposerMode("frame")} size="sm" variant="ghost">Frame</Button><Button aria-pressed={composerMode === "text"} className={cn("h-7 px-2 text-xs", composerMode === "text" && "bg-white/10 text-white")} onClick={() => setComposerMode("text")} size="sm" variant="ghost">Text</Button></div>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{outputPresets[preset].label}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6 sm:p-8">
            {composerMode === "frame" ? <section aria-label="Choose a visual treatment" className="w-full max-w-3xl"><p className="mb-2 text-sm font-medium text-slate-200">Choose by seeing</p><div className="grid grid-cols-3 gap-3">{layoutOptions.map((option) => <FrameChoiceCard description={option.description} key={option.mode} onSelect={() => selectLayout(option.mode)} selected={mode === option.mode} title={option.title}><EditorPreviewStage canvasLayout={canvasLayout} className="size-full" focusLayout={focusLayout} isPlaying={isPlaying && mode === option.mode} mode={option.mode} onOverlayLayoutChange={(id, change) => updateOverlays((current) => current.map((overlay) => overlay.id === id ? createTextOverlay(overlay.id, { ...overlay, ...change }) : overlay))} onOverlaySelect={(id) => { setSelectedOverlayId(id); setComposerMode("text"); }} onPlaybackTimeChange={(timeSeconds) => { if (mode === option.mode) setCurrentTime(timeSeconds); }} output={outputPresets[preset]} overlays={overlays} playback={playback} posterLayout={posterLayout} seekRequest={seekRequest} selectedOverlayId={selectedOverlayId} showSafeAreaGuides={showSafeAreaGuides && mode === option.mode} sourceUrl={sourceUrl} videoAdjustments={videoAdjustments} /></FrameChoiceCard>)}</div></section> : <><TextOverlayToolbar durationSeconds={getExportDurationSeconds(playback)} onAdd={() => addOverlay()} onAddSticker={(text) => addOverlay({ backgroundColor: "transparent", entranceAnimation: "pop", fontFamily: "rounded", fontSizePercent: 12, text, widthPercent: 24 })} onAddTemplate={(template) => addOverlay(template)} onChange={(id, change) => updateOverlays((current) => current.map((overlay) => overlay.id === id ? createTextOverlay(overlay.id, { ...overlay, ...change }) : overlay))} onDelete={(id) => { updateOverlays((current) => current.filter((overlay) => overlay.id !== id)); setSelectedOverlayId(undefined); }} onDuplicate={duplicateOverlay} onSelect={setSelectedOverlayId} overlays={overlays} selected={overlays.find((overlay) => overlay.id === selectedOverlayId)} /><EditorPreviewStage canvasLayout={canvasLayout} className="aspect-[9/16] h-[min(55vh,36rem)] min-h-80 max-h-full w-auto max-w-full rounded-xl shadow-2xl shadow-black/50" focusLayout={focusLayout} isPlaying={isPlaying} mode={mode} onOverlayLayoutChange={(id, change) => updateOverlays((current) => current.map((overlay) => overlay.id === id ? createTextOverlay(overlay.id, { ...overlay, ...change }) : overlay))} onOverlaySelect={(id) => { setSelectedOverlayId(id); setComposerMode("text"); }} onPlaybackTimeChange={setCurrentTime} output={outputPresets[preset]} overlays={overlays} playback={playback} posterLayout={posterLayout} seekRequest={seekRequest} selectedOverlayId={selectedOverlayId} showSafeAreaGuides={showSafeAreaGuides} sourceUrl={sourceUrl} videoAdjustments={videoAdjustments} /></>}
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
                {mode === "canvas" ? <div className="mt-5 space-y-4"><EditorRangeControl label="Backdrop blur" max={48} suffix=" px" value={canvasLayout.backdropBlurPixels} onChange={(backdropBlurPixels) => setCanvasLayout(createCanvasLayout(backdropBlurPixels, canvasLayout.backdropOpacity, canvasLayout.dimOpacity))} /><EditorRangeControl label="Backdrop intensity" suffix="%" value={canvasLayout.backdropOpacity * 100} onChange={(backdropOpacity) => setCanvasLayout(createCanvasLayout(canvasLayout.backdropBlurPixels, backdropOpacity / 100, canvasLayout.dimOpacity))} /><EditorRangeControl label="Backdrop dim" max={80} suffix="%" value={canvasLayout.dimOpacity * 100} onChange={(dimOpacity) => setCanvasLayout(createCanvasLayout(canvasLayout.backdropBlurPixels, canvasLayout.backdropOpacity, dimOpacity / 100))} /></div> : null}
                {mode === "focus" ? <div className="mt-5 space-y-4"><EditorRangeControl label="Position" suffix="%" value={focusLayout.panX} onChange={(panX) => setFocusLayout(createFocusLayout(panX, focusLayout.zoom))} /><EditorRangeControl label="Scale" max={2} min={1} step={0.01} suffix="×" value={focusLayout.zoom} onChange={(zoom) => setFocusLayout(createFocusLayout(focusLayout.panX, zoom))} /></div> : null}
                {mode === "poster" ? <div className="mt-5 space-y-3"><Input aria-label="Poster headline" onChange={(event) => setPosterLayout((layout) => ({ ...layout, headline: event.target.value }))} placeholder="Headline" value={posterLayout.headline} /><Input aria-label="Poster subline" onChange={(event) => setPosterLayout((layout) => ({ ...layout, subline: event.target.value }))} placeholder="Supporting line" value={posterLayout.subline} /></div> : null}
                <div className="mt-5 space-y-4 border-t border-white/10 pt-5"><p className="text-sm font-medium text-white">Colour adjustments</p><EditorRangeControl label="Brightness" max={150} min={50} suffix="%" value={videoAdjustments.brightness} onChange={(brightness) => setVideoAdjustments(createVideoAdjustments({ ...videoAdjustments, brightness }))} /><EditorRangeControl label="Contrast" max={150} min={50} suffix="%" value={videoAdjustments.contrast} onChange={(contrast) => setVideoAdjustments(createVideoAdjustments({ ...videoAdjustments, contrast }))} /><EditorRangeControl label="Saturation" max={200} suffix="%" value={videoAdjustments.saturate} onChange={(saturate) => setVideoAdjustments(createVideoAdjustments({ ...videoAdjustments, saturate }))} /><EditorRangeControl label="Warmth" max={40} min={-40} suffix="°" value={videoAdjustments.warmth} onChange={(warmth) => setVideoAdjustments(createVideoAdjustments({ ...videoAdjustments, warmth }))} /></div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="trim">
              <AccordionTrigger className="py-4 text-base text-white hover:no-underline">Trim &amp; audio</AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5"><EditorRangeControl label="Starts at" max={Math.max(0, playback.trimEndSeconds - 0.1)} suffix="" value={playback.trimStartSeconds} onChange={(trimStartSeconds) => updatePlayback({ trimStartSeconds })} /><EditorRangeControl label="Ends at" min={Math.min(durationSeconds, playback.trimStartSeconds + 0.1)} max={durationSeconds} suffix="" value={playback.trimEndSeconds} onChange={(trimEndSeconds) => updatePlayback({ trimEndSeconds })} /><div className="space-y-2"><label className="text-sm font-medium" htmlFor="playback-speed">Speed</label><Select onValueChange={(value) => value && updatePlayback({ speed: Number(value) as PlaybackSpeed })} value={String(playback.speed)}><SelectTrigger className="h-11 w-full border-white/10 bg-black/20 text-left text-white" id="playback-speed"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{playbackSpeeds.map((speed) => <SelectItem key={speed} value={String(speed)}>{speed}×</SelectItem>)}</SelectContent></Select><p className="text-xs text-slate-500">Export: {formatTime(getExportDurationSeconds(playback))} at {playback.speed}×. Faster exports preserve Vertara’s rendered frames.</p></div><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm font-medium"><Checkbox checked={playback.muted} onCheckedChange={(checked) => updatePlayback({ muted: checked === true })} /> <AudioLines className="size-4 text-slate-400" /> Mute original audio</label></AccordionContent>
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
