"use client";

import { useState } from "react";

import { EditorColorPicker } from "@/components/atoms/editor-color-picker";
import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { ToolSection, ToolStatus } from "@/components/atoms/tool-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPlaybackSettings, getExportDurationSeconds, playbackSpeeds, type PlaybackSettings, type PlaybackSpeed } from "@/features/project/playback-settings";
import { createCanvasLayout } from "@/features/render/canvas-layout";
import { createFocusLayout } from "@/features/render/focus-layout";
import type { ProjectRenderState } from "@/features/render/project-render";
import { createVideoAdjustments } from "@/features/render/video-adjustments";
import { scanFaceTrack } from "@/features/vision/face-tracking";
import { formatTime } from "@/lib/format-time";

interface FramePanelProps {
  durationSeconds: number;
  onChange(change: Partial<Pick<ProjectRenderState, "background" | "canvasLayout" | "focusLayout" | "mode" | "posterLayout" | "videoAdjustments">>): void;
  onPlaybackChange(change: Partial<PlaybackSettings>): void;
  project: ProjectRenderState;
  sourceUrl: string;
}

const backgroundModes = [
  { label: "Keep original", value: "off" },
  { label: "Blur it", value: "blur" },
  { label: "Solid colour", value: "color" },
] as const;

export function FramePanel({ durationSeconds, onChange, onPlaybackChange, project, sourceUrl }: FramePanelProps) {
  const { background, canvasLayout, focusLayout, mode, output, playback, posterLayout, videoAdjustments } = project;
  const [trackingProgress, setTrackingProgress] = useState<number>();
  const [trackingMessage, setTrackingMessage] = useState<{ text: string; tone: "error" | "success" }>();
  const hasTrack = (focusLayout.track?.length ?? 0) > 0;

  async function followFace() {
    setTrackingMessage(undefined);
    setTrackingProgress(0);
    try {
      const track = await scanFaceTrack(sourceUrl, playback, output, focusLayout.zoom, setTrackingProgress);
      if (track.length === 0) setTrackingMessage({ text: "No face was found, so the crop stays where you set it. This works best when your face fills a good part of the shot, like a talking-head video.", tone: "error" });
      else { onChange({ focusLayout: { ...focusLayout, track }, mode: "focus" }); setTrackingMessage({ text: "Done. The crop now follows your face. Press play to see it.", tone: "success" }); }
    } catch (error) {
      setTrackingMessage({ text: error instanceof Error ? `Face tracking could not start: ${error.message}` : "Face tracking could not start.", tone: "error" });
    } finally {
      setTrackingProgress(undefined);
    }
  }

  return <div className="space-y-3">
    <ToolSection description="Vertara moves the crop so your face stays in frame as you move. It works best on close-up, talking-head shots. The first use downloads a small tool (about 15 MB). Your video stays on this device." title="Follow my face">
      {trackingProgress === undefined ? <Button className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={followFace}>{hasTrack ? "Scan again" : "Keep my face in frame"}</Button> : <ToolStatus tone="progress">Watching your video… {Math.round(trackingProgress * 100)}%</ToolStatus>}
      {trackingMessage ? <ToolStatus tone={trackingMessage.tone}>{trackingMessage.text}</ToolStatus> : null}
      {hasTrack ? <Button className="w-full" onClick={() => { onChange({ focusLayout: createFocusLayout(focusLayout.panX, focusLayout.zoom) }); setTrackingMessage(undefined); }} size="sm" variant="ghost">Stop following</Button> : null}
    </ToolSection>

    <ToolSection description="Hide what is behind you without a green screen. It works best with one person clearly in the shot. This shares the same small download." title="Replace my background">
      <Select onValueChange={(value) => value && onChange({ background: { ...background, mode: value as typeof background.mode } })} value={background.mode}><SelectTrigger aria-label="Background" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{backgroundModes.find((option) => option.value === background.mode)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{backgroundModes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      {background.mode === "color" ? <label className="flex items-center justify-between text-sm text-slate-200">Background colour <EditorColorPicker label="Background colour" onChange={(color) => color !== "transparent" && onChange({ background: { ...background, color } })} value={background.color} /></label> : null}
    </ToolSection>

    <ToolSection description="Fine-tune the look you picked in the preview." title="Adjust the frame">
      {mode === "canvas" ? <div className="space-y-4"><EditorRangeControl label="Backdrop blur" max={48} suffix=" px" value={canvasLayout.backdropBlurPixels} onChange={(backdropBlurPixels) => onChange({ canvasLayout: createCanvasLayout(backdropBlurPixels, canvasLayout.backdropOpacity, canvasLayout.dimOpacity) })} /><EditorRangeControl label="Backdrop intensity" suffix="%" value={canvasLayout.backdropOpacity * 100} onChange={(backdropOpacity) => onChange({ canvasLayout: createCanvasLayout(canvasLayout.backdropBlurPixels, backdropOpacity / 100, canvasLayout.dimOpacity) })} /><EditorRangeControl label="Backdrop dim" max={80} suffix="%" value={canvasLayout.dimOpacity * 100} onChange={(dimOpacity) => onChange({ canvasLayout: createCanvasLayout(canvasLayout.backdropBlurPixels, canvasLayout.backdropOpacity, dimOpacity / 100) })} /></div> : null}
      {mode === "focus" ? <div className="space-y-4">{hasTrack ? <p className="text-xs text-slate-400">Position is set automatically while the crop follows your face.</p> : <EditorRangeControl label="Position" suffix="%" value={focusLayout.panX} onChange={(panX) => onChange({ focusLayout: createFocusLayout(panX, focusLayout.zoom) })} />}<EditorRangeControl label="Scale" max={2} min={1} step={0.01} suffix="×" value={focusLayout.zoom} onChange={(zoom) => onChange({ focusLayout: { ...createFocusLayout(focusLayout.panX, zoom), track: focusLayout.track } })} /></div> : null}
      {mode === "poster" ? <div className="space-y-3"><Input aria-label="Poster headline" onChange={(event) => onChange({ posterLayout: { ...posterLayout, headline: event.target.value } })} placeholder="Headline" value={posterLayout.headline} /><Input aria-label="Poster subline" onChange={(event) => onChange({ posterLayout: { ...posterLayout, subline: event.target.value } })} placeholder="Supporting line" value={posterLayout.subline} /></div> : null}
    </ToolSection>

    <ToolSection description="Choose where the video starts and ends, and how fast it plays." title="Trim and speed">
      <EditorRangeControl label="Starts at" max={Math.max(0, playback.trimEndSeconds - 0.1)} suffix="" value={playback.trimStartSeconds} onChange={(trimStartSeconds) => onPlaybackChange({ trimStartSeconds })} />
      <EditorRangeControl label="Ends at" min={Math.min(durationSeconds, playback.trimStartSeconds + 0.1)} max={durationSeconds} suffix="" value={playback.trimEndSeconds} onChange={(trimEndSeconds) => onPlaybackChange({ trimEndSeconds })} />
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="playback-speed">Speed</label><Select onValueChange={(value) => value && onPlaybackChange({ speed: Number(value) as PlaybackSpeed })} value={String(playback.speed)}><SelectTrigger className="h-11 w-full border-white/10 bg-black/20 text-left text-white" id="playback-speed"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{playbackSpeeds.map((speed) => <SelectItem key={speed} value={String(speed)}>{speed}×</SelectItem>)}</SelectContent></Select><p className="text-xs text-slate-500">Finished video: {formatTime(getExportDurationSeconds(createPlaybackSettings(durationSeconds, playback)))} at {playback.speed}×.</p></div>
    </ToolSection>

    <ToolSection description="Make the picture brighter, punchier, or warmer." title="Colour">
      <EditorRangeControl label="Brightness" max={150} min={50} suffix="%" value={videoAdjustments.brightness} onChange={(brightness) => onChange({ videoAdjustments: createVideoAdjustments({ ...videoAdjustments, brightness }) })} />
      <EditorRangeControl label="Contrast" max={150} min={50} suffix="%" value={videoAdjustments.contrast} onChange={(contrast) => onChange({ videoAdjustments: createVideoAdjustments({ ...videoAdjustments, contrast }) })} />
      <EditorRangeControl label="Saturation" max={200} suffix="%" value={videoAdjustments.saturate} onChange={(saturate) => onChange({ videoAdjustments: createVideoAdjustments({ ...videoAdjustments, saturate }) })} />
      <EditorRangeControl label="Warmth" max={40} min={-40} suffix="°" value={videoAdjustments.warmth} onChange={(warmth) => onChange({ videoAdjustments: createVideoAdjustments({ ...videoAdjustments, warmth }) })} />
    </ToolSection>
  </div>;
}
