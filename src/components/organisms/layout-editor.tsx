"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Pause, Play, ScanLine, Redo2, Settings2, Undo2, Volume2 } from "lucide-react";

import { MusicPreview } from "@/components/atoms/music-preview";
import { BrandPanel } from "@/components/molecules/brand-panel";
import { CaptionsPanel } from "@/components/molecules/captions-panel";
import { CleanupPanel } from "@/components/molecules/cleanup-panel";
import { EditorGuide, editorSteps, type EditorTool } from "@/components/molecules/editor-guide";
import { EditorPreviewStage } from "@/components/molecules/editor-preview-stage";
import { EditorTimeline } from "@/components/molecules/editor-timeline";
import { ExportPanel, type ExportJobProgress } from "@/components/molecules/export-panel";
import { FrameChoiceCard } from "@/components/molecules/frame-choice-card";
import { FramePanel } from "@/components/molecules/frame-panel";
import { TextLayerAddMenu, TextLayerInspector } from "@/components/molecules/text-layer-inspector";
import { TextLayerTimeline } from "@/components/molecules/text-layer-timeline";
import { Button } from "@/components/ui/button";
import { defaultAudioSettings, type AudioSettings } from "@/features/audio/audio-settings";
import { prepareExportAudio } from "@/features/audio/export-audio";
import { detectSilentRanges } from "@/features/audio/silence-detection";
import { getMonoSamples, loadSourceAudio } from "@/features/audio/source-audio";
import { createSavedTextStyle, defaultBrandKit, loadBrandKit, saveBrandKit, type BrandKit } from "@/features/brand/brand-kit";
import { defaultCaptionSettings, type CaptionSettings, type TranscriptWord } from "@/features/captions/captions";
import { ExportCancelledError, exportLocalMp4 } from "@/features/export/local-mp4-exporter";
import type { MediaDescriptor } from "@/features/media/media.types";
import { replaceCuts, toggleWordCut, type ClipCut, type CutSource } from "@/features/project/clip-cuts";
import { commitEdit, createEditHistory, redoEdit, undoEdit } from "@/features/project/edit-history";
import { outputPresets, type OutputPreset } from "@/features/project/output-settings";
import { createPlaybackSettings, getExportDurationSeconds, getOutputElapsedSeconds, type PlaybackSettings, type TimeRange } from "@/features/project/playback-settings";
import { createTextOverlay, duplicateTextOverlay, type TextOverlay } from "@/features/project/text-overlays";
import { defaultCanvasLayout } from "@/features/render/canvas-layout";
import { defaultFocusLayout } from "@/features/render/focus-layout";
import { defaultPosterLayout } from "@/features/render/poster-layout";
import { defaultBackgroundSettings, type ExportLayoutMode, type ProjectRenderState } from "@/features/render/project-render";
import { defaultVideoAdjustments } from "@/features/render/video-adjustments";
import { downloadFile } from "@/lib/download-file";
import { formatTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";

/** Edits people expect undo to cover: text layers and every kind of cut. */
interface ProjectEdits {
  cuts: ClipCut[];
  overlays: TextOverlay[];
}

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

const stickerTemplate: Partial<TextOverlay> = { backgroundColor: "transparent", entranceAnimation: "pop", fontFamily: "rounded", fontSizePercent: 12, kind: "sticker", widthPercent: 24 };

type VisualSettings = Pick<ProjectRenderState, "background" | "canvasLayout" | "focusLayout" | "mode" | "posterLayout" | "videoAdjustments">;

export function LayoutEditor({ durationSeconds, media, sourceUrl }: LayoutEditorProps) {
  const [activeTool, setActiveTool] = useState<EditorTool>("frame");
  const [audio, setAudio] = useState<AudioSettings>(defaultAudioSettings);
  const [brandKit, setBrandKit] = useState<BrandKit>(defaultBrandKit);
  const [captions, setCaptions] = useState<CaptionSettings>(defaultCaptionSettings);
  const [currentTime, setCurrentTime] = useState(0);
  const [edits, setEdits] = useState(() => createEditHistory<ProjectEdits>({ cuts: [], overlays: [] }));
  const [exportError, setExportError] = useState<string>();
  const [exportProgress, setExportProgress] = useState<ExportJobProgress>();
  const [extraPresets, setExtraPresets] = useState<OutputPreset[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pauses, setPauses] = useState<TimeRange[]>([]);
  const [playbackBase, setPlaybackBase] = useState(() => createPlaybackSettings(durationSeconds));
  const [preset, setPreset] = useState<OutputPreset>("youtube-shorts");
  const [seekRequest, setSeekRequest] = useState({ id: 0, timeSeconds: 0 });
  const [selectedOverlayId, setSelectedOverlayId] = useState<string>();
  const [showSafeAreaGuides, setShowSafeAreaGuides] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptWord[]>([]);
  const [visual, setVisual] = useState<VisualSettings>({ background: defaultBackgroundSettings, canvasLayout: defaultCanvasLayout, focusLayout: defaultFocusLayout, mode: "canvas", posterLayout: defaultPosterLayout, videoAdjustments: defaultVideoAdjustments });
  const exportAbortController = useRef<AbortController | undefined>(undefined);
  const { cuts, overlays } = edits.present;

  const playback = useMemo(() => createPlaybackSettings(durationSeconds, { ...playbackBase, removedRanges: cuts }), [cuts, durationSeconds, playbackBase]);
  const output = outputPresets[preset];
  const project = useMemo<ProjectRenderState>(() => ({ ...visual, brand: brandKit, captions, output, overlays, playback, transcript }), [brandKit, captions, output, overlays, playback, transcript, visual]);
  const outputSeconds = getOutputElapsedSeconds(currentTime - playback.trimStartSeconds, playback);
  const isExporting = exportProgress !== undefined;

  const completedTools = useMemo(() => {
    const completed = new Set<EditorTool>();
    if (visual.mode !== "canvas" || visual.background.mode !== "off" || (visual.focusLayout.track?.length ?? 0) > 0) completed.add("frame");
    if (cuts.some((cut) => cut.source === "silence" || cut.source === "beat") || audio.cleanup || audio.music) completed.add("cleanup");
    if (captions.enabled) completed.add("captions");
    if (overlays.length > 0) completed.add("text");
    if (brandKit.logoDataUrl) completed.add("brand");
    return completed;
  }, [audio.cleanup, audio.music, brandKit.logoDataUrl, captions.enabled, cuts, overlays.length, visual.background.mode, visual.focusLayout.track, visual.mode]);

  useEffect(() => {
    // Browser storage is unavailable during server rendering, so the saved kit loads after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrandKit(loadBrandKit());
  }, []);

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if ((!event.metaKey && !event.ctrlKey) || event.key.toLowerCase() !== "z" || target?.isContentEditable || target?.matches("input, textarea, select")) return;
      event.preventDefault();
      setEdits((history) => event.shiftKey ? redoEdit(history) : undoEdit(history));
    }
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, []);

  useEffect(() => {
    if (!audio.music?.duck) return;
    let isCurrent = true;
    void loadSourceAudio(sourceUrl).then((source) => { if (source && isCurrent) setPauses(detectSilentRanges(getMonoSamples(source), source.sampleRate, "tight")); });
    return () => { isCurrent = false; };
  }, [audio.music?.duck, sourceUrl]);

  function updatePlayback(partial: Partial<PlaybackSettings>) {
    const nextPlayback = createPlaybackSettings(durationSeconds, { ...playbackBase, ...partial });
    setPlaybackBase(nextPlayback);
    setCurrentTime((time) => Math.min(Math.max(time, nextPlayback.trimStartSeconds), nextPlayback.trimEndSeconds));
  }

  function updateOverlays(update: (current: TextOverlay[]) => TextOverlay[]) {
    setEdits((history) => commitEdit(history, { ...history.present, overlays: update(history.present.overlays) }));
  }

  function changeOverlay(id: string, change: Partial<TextOverlay>) {
    updateOverlays((current) => current.map((overlay) => overlay.id === id ? createTextOverlay(overlay.id, { ...overlay, ...change }) : overlay));
  }

  function updateCuts(update: (current: ClipCut[]) => ClipCut[]) {
    setEdits((history) => commitEdit(history, { ...history.present, cuts: update(history.present.cuts) }));
  }

  function setCutsFrom(source: CutSource, ranges: TimeRange[]) {
    updateCuts((current) => replaceCuts(current, source, ranges));
  }

  function createOverlayId() {
    return `text-${Date.now()}-${overlays.length}`;
  }

  function addOverlay(partial: Partial<TextOverlay> = {}) {
    const overlay = createTextOverlay(createOverlayId(), { color: brandKit.textColor, durationSeconds: Math.min(2, getExportDurationSeconds(playback)), ...partial });
    updateOverlays((current) => [...current, overlay]);
    setSelectedOverlayId(overlay.id);
  }

  function duplicateOverlay(id: string) {
    const source = overlays.find((overlay) => overlay.id === id);
    if (!source) return;
    const duplicate = duplicateTextOverlay(source, createOverlayId());
    updateOverlays((current) => [...current, duplicate]);
    setSelectedOverlayId(duplicate.id);
  }

  function updateBrandKit(kit: BrandKit) {
    setBrandKit(kit);
    saveBrandKit(kit);
  }

  function applyBrandToProject() {
    updateOverlays((current) => current.map((overlay) => overlay.kind === "sticker" ? overlay : createTextOverlay(overlay.id, { ...overlay, color: brandKit.textColor, fontFamily: brandKit.fontFamily })));
    setCaptions((current) => ({ ...current, color: brandKit.textColor, fontFamily: brandKit.fontFamily, highlightColor: brandKit.accentColor }));
  }

  function saveTextStyle(overlay: TextOverlay) {
    updateBrandKit({ ...brandKit, savedStyles: [...brandKit.savedStyles, createSavedTextStyle(`style-${Date.now()}`, `Look ${brandKit.savedStyles.length + 1}`, overlay)] });
  }

  function openTool(tool: EditorTool) {
    setActiveTool(tool);
    // Frame shows a different preview from the other steps, so it needs telling where to continue from.
    if ((tool === "frame") !== (activeTool === "frame")) setSeekRequest((request) => ({ id: request.id + 1, timeSeconds: currentTime }));
  }

  function seekTo(timeSeconds: number) {
    const clampedTime = Math.min(Math.max(timeSeconds, playback.trimStartSeconds), playback.trimEndSeconds);
    setCurrentTime(clampedTime);
    setSeekRequest((request) => ({ id: request.id + 1, timeSeconds: clampedTime }));
  }

  async function handleExport() {
    setExportError(undefined);
    const presets = [preset, ...extraPresets.filter((item) => outputPresets[item].label !== output.label)];
    setExportProgress({ fileIndex: 1, fileProgress: 0, phase: "audio", totalFiles: presets.length });
    setIsPlaying(false);
    const abortController = new AbortController();
    exportAbortController.current = abortController;

    try {
      const exportAudio = await prepareExportAudio(audio, playback, sourceUrl);
      for (const [index, item] of presets.entries()) {
        const file = await exportLocalMp4({
          abortSignal: abortController.signal,
          audio: exportAudio,
          onProgress: (fileProgress) => setExportProgress({ fileIndex: index + 1, fileProgress, phase: "video", totalFiles: presets.length }),
          project: { ...project, output: outputPresets[item] },
          sourceUrl,
        });
        downloadFile(file, `vertara-${item}.mp4`);
      }
    } catch (error) {
      if (!(error instanceof ExportCancelledError)) {
        setExportError(error instanceof Error ? error.message : "The local export could not be completed.");
      }
    } finally {
      exportAbortController.current = undefined;
      setExportProgress(undefined);
    }
  }

  const stage = { cleanupAudio: audio.cleanup, currentTime, onOverlayLayoutChange: changeOverlay, onOverlaySelect: (id: string) => { setSelectedOverlayId(id); openTool("text"); }, seekRequest, selectedOverlayId, sourceUrl };
  const previewAspectRatio = `${output.width} / ${output.height}`;
  const activeStepIndex = editorSteps.findIndex((step) => step.id === activeTool);
  const nextStep = editorSteps[activeStepIndex + 1];

  return (
    <section className="vertara-workspace dark h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#101216] text-slate-100 shadow-2xl shadow-black/35">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-cyan-400 font-bold text-slate-950">V</div>
          <div><p className="text-sm font-semibold tracking-[0.16em]">VERTARA</p><p className="hidden text-xs text-slate-500 sm:block">Free · Your video stays on this device</p></div>
        </div>
        <div className="ml-auto mr-3 flex items-center gap-1"><Button aria-label={showSafeAreaGuides ? "Hide safe area guides" : "Show safe area guides"} onClick={() => setShowSafeAreaGuides((visible) => !visible)} size="icon-sm" title="Show where platform buttons may cover your video" variant="ghost"><ScanLine className={cn(showSafeAreaGuides && "text-cyan-300")} /></Button><Button aria-label="Undo" disabled={edits.past.length === 0} onClick={() => setEdits(undoEdit)} size="icon-sm" title="Undo text and cut edits (⌘Z)" variant="ghost"><Undo2 /></Button><Button aria-label="Redo" disabled={edits.future.length === 0} onClick={() => setEdits(redoEdit)} size="icon-sm" title="Redo text and cut edits (⇧⌘Z)" variant="ghost"><Redo2 /></Button></div>
        {isExporting ? (
          <Button className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => exportAbortController.current?.abort()} variant="outline">Cancel export · {Math.round(exportProgress.fileProgress * 100)}%</Button>
        ) : (
          <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => openTool("export")}>Export</Button>
        )}
      </header>

      <div className="grid h-[calc(100%-4rem)] min-h-0 grid-cols-[minmax(0,1fr)] content-start overflow-y-auto lg:content-stretch lg:grid-cols-[14rem_minmax(0,1fr)_25rem] lg:grid-rows-1 lg:overflow-hidden">
        <aside className="border-b border-white/10 p-3 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <p className="hidden px-2 pb-3 pt-1 text-xs leading-5 text-slate-400 lg:block">Work from top to bottom. Every step is optional, so skip anything you don&apos;t need.</p>
          <EditorGuide activeTool={activeTool} completedTools={completedTools} onSelect={openTool} />
          <div className="mt-4 hidden rounded-xl border border-white/10 p-3 text-sm lg:block">
            <p className="truncate text-slate-300" title={media.name}>{media.name}</p>
            <p className="mt-1 text-xs text-slate-500">{media.width} × {media.height} · {formatTime(durationSeconds)}</p>
          </div>
        </aside>

        <main className="flex min-h-[85dvh] min-w-0 flex-col overflow-hidden lg:min-h-0">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-2 text-sm text-slate-400"><Settings2 className="size-4" /> Preview</div>
            <div className="ml-auto mr-3 flex items-center gap-2">{activeTool === "text" ? <TextLayerAddMenu onAddSticker={(text) => addOverlay({ ...stickerTemplate, text })} onAddTemplate={addOverlay} /> : null}</div>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">{output.label}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-auto p-6 sm:p-8">
            {activeTool === "frame" ? <section aria-label="Choose a visual treatment" className="w-full max-w-3xl"><p className="mb-2 text-sm font-medium text-slate-200">Pick the look you like best</p><div className="grid grid-cols-3 gap-3">{layoutOptions.map((option) => <FrameChoiceCard aspectRatio={previewAspectRatio} description={option.description} key={option.mode} onSelect={() => setVisual((current) => ({ ...current, mode: option.mode }))} selected={visual.mode === option.mode} title={option.title}><EditorPreviewStage {...stage} className="size-full" isPlaying={isPlaying && visual.mode === option.mode} onPlaybackTimeChange={visual.mode === option.mode ? setCurrentTime : undefined} project={{ ...project, background: visual.mode === option.mode ? visual.background : defaultBackgroundSettings, mode: option.mode }} showSafeAreaGuides={showSafeAreaGuides && visual.mode === option.mode} /></FrameChoiceCard>)}</div></section> : <div className={cn("max-w-full", output.width >= output.height ? "w-full max-w-3xl" : "h-[min(62vh,42rem)] min-h-80")} style={{ aspectRatio: previewAspectRatio }}><EditorPreviewStage {...stage} className="size-full rounded-xl shadow-2xl shadow-black/50" isPlaying={isPlaying} onPlaybackTimeChange={setCurrentTime} project={project} showSafeAreaGuides={showSafeAreaGuides} /></div>}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-5 py-3">
            <Button aria-label={isPlaying ? "Pause preview" : "Play preview"} onClick={() => setIsPlaying((playing) => !playing)} size="icon" variant="ghost">{isPlaying ? <Pause /> : <Play />}</Button>
            <span className="font-mono text-sm text-cyan-300">{formatTime(outputSeconds)} <span className="text-slate-500">/ {formatTime(getExportDurationSeconds(playback))}</span></span>
            <Button aria-label="Toggle preview sound" onClick={() => updatePlayback({ muted: !playback.muted })} size="icon" variant="ghost"><Volume2 className={cn(playback.muted && "opacity-40")} /></Button>
          </div>
          {activeTool === "text" ? <TextLayerTimeline onSelect={setSelectedOverlayId} overlays={overlays} selectedOverlayId={selectedOverlayId} totalSeconds={getExportDurationSeconds(playback)} /> : null}
          <EditorTimeline currentTime={currentTime} onSeek={seekTo} playback={playback} totalSeconds={durationSeconds} />
          {audio.music ? <MusicPreview isPlaying={isPlaying} isSpeaking={!pauses.some((pause) => currentTime >= pause.startSeconds && currentTime < pause.endSeconds)} music={audio.music} outputSeconds={outputSeconds} /> : null}
        </main>

        <aside className="border-t border-white/10 bg-[#12151a] p-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <h2 className="mb-3 text-base font-semibold text-white">{editorSteps[activeStepIndex].title}</h2>
          {activeTool === "frame" ? <FramePanel durationSeconds={durationSeconds} onChange={(change) => setVisual((current) => ({ ...current, ...change }))} onPlaybackChange={updatePlayback} project={project} sourceUrl={sourceUrl} /> : null}
          {activeTool === "cleanup" ? <CleanupPanel audio={audio} cuts={cuts} durationSeconds={durationSeconds} onAudioChange={setAudio} onCutsChange={setCutsFrom} onPlaybackChange={updatePlayback} playback={playback} sourceUrl={sourceUrl} /> : null}
          {activeTool === "captions" ? <CaptionsPanel cuts={cuts} onCutFillers={(ranges) => setCutsFrom("filler", ranges)} onSettingsChange={setCaptions} onToggleWord={(word) => updateCuts((current) => toggleWordCut(current, word))} onTranscript={setTranscript} playback={playback} settings={captions} sourceUrl={sourceUrl} transcript={transcript} /> : null}
          {activeTool === "text" ? <TextLayerInspector durationSeconds={getExportDurationSeconds(playback)} onChange={changeOverlay} onDelete={(id) => { updateOverlays((current) => current.filter((overlay) => overlay.id !== id)); setSelectedOverlayId(undefined); }} onDuplicate={duplicateOverlay} onSaveStyle={saveTextStyle} onSelect={setSelectedOverlayId} overlays={overlays} savedStyles={brandKit.savedStyles} selected={overlays.find((overlay) => overlay.id === selectedOverlayId)} /> : null}
          {activeTool === "brand" ? <BrandPanel kit={brandKit} onApply={applyBrandToProject} onChange={updateBrandKit} overlayCount={overlays.length} /> : null}
          {activeTool === "export" ? <ExportPanel error={exportError} extraPresets={extraPresets} onCancel={() => exportAbortController.current?.abort()} onExport={handleExport} onExtraPresetsChange={setExtraPresets} onPresetChange={setPreset} playback={playback} preset={preset} progress={exportProgress} /> : null}
          {nextStep ? <Button className="mt-4 w-full justify-between" onClick={() => openTool(nextStep.id)} variant="outline">Next: {nextStep.title}<ArrowRight /></Button> : null}
        </aside>
      </div>
    </section>
  );
}
