"use client";

import { useRef, useState } from "react";

import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { ToolSection, ToolStatus } from "@/components/atoms/tool-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadSourceAudio, resampleToMono } from "@/features/audio/source-audio";
import { captionStylePresets, createSubtitleFile, isFillerWord, isWordCut, type CaptionSettings, type TranscriptWord } from "@/features/captions/captions";
import { transcribeOnDevice, whisperSampleRate, type TranscribeStatus } from "@/features/captions/transcribe";
import { countCuts, type ClipCut } from "@/features/project/clip-cuts";
import type { PlaybackSettings, TimeRange } from "@/features/project/playback-settings";
import { downloadFile } from "@/lib/download-file";
import { cn } from "@/lib/utils";

interface CaptionsPanelProps {
  cuts: ClipCut[];
  onCutFillers(ranges: TimeRange[]): void;
  onSettingsChange(settings: CaptionSettings): void;
  onToggleWord(word: TranscriptWord): void;
  onTranscript(words: TranscriptWord[]): void;
  playback: PlaybackSettings;
  settings: CaptionSettings;
  sourceUrl: string;
  transcript: TranscriptWord[];
}

const languages = [
  { label: "Detect automatically", value: "auto" }, { label: "English", value: "english" }, { label: "Hindi", value: "hindi" }, { label: "Spanish", value: "spanish" }, { label: "French", value: "french" }, { label: "German", value: "german" }, { label: "Portuguese", value: "portuguese" }, { label: "Arabic", value: "arabic" }, { label: "Japanese", value: "japanese" }, { label: "Korean", value: "korean" },
];

export function CaptionsPanel({ cuts, onCutFillers, onSettingsChange, onToggleWord, onTranscript, playback, settings, sourceUrl, transcript }: CaptionsPanelProps) {
  const [error, setError] = useState<string>();
  const [language, setLanguage] = useState("auto");
  const [status, setStatus] = useState<TranscribeStatus | { type: "preparing" }>();
  const cancelRef = useRef<(() => void) | undefined>(undefined);
  const fillers = transcript.filter((word) => isFillerWord(word.text));
  const fillerCutCount = countCuts(cuts, "filler");

  async function createCaptions() {
    setError(undefined); setStatus({ type: "preparing" });
    try {
      const source = await loadSourceAudio(sourceUrl);
      if (!source) throw new Error("This video has no sound Vertara can read.");
      const samples = await resampleToMono(source, whisperSampleRate);
      const job = transcribeOnDevice(samples, language === "auto" ? undefined : language, setStatus);
      cancelRef.current = job.cancel;
      const words = await job.result;
      if (words.length === 0) setError("No speech was found in this video.");
      else { onTranscript(words); onSettingsChange({ ...settings, enabled: true }); }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Captions could not be created.");
    } finally {
      cancelRef.current = undefined; setStatus(undefined);
    }
  }

  function downloadSubtitles(format: "srt" | "vtt") {
    downloadFile(new Blob([createSubtitleFile(transcript, playback, format)], { type: "text/plain" }), `vertara-captions.${format}`);
  }

  const statusText = status?.type === "downloading" ? `Getting the captions tool ready… ${Math.round(status.progress * 100)}%. This only happens once.` : status?.type === "listening" ? "Listening to your video. This can take about as long as the video itself." : "Preparing your audio…";

  return <div className="space-y-3">
    <ToolSection description={transcript.length > 0 ? "Your captions are ready. The word being spoken lights up as the video plays." : "Vertara listens to your video and writes word-by-word subtitles. The first use downloads a captions tool (about 100 MB). Your video stays on this device."} title="Auto captions">
      {status ? <><ToolStatus tone="progress">{statusText}</ToolStatus><Button className="w-full" onClick={() => cancelRef.current?.()} size="sm" variant="ghost">Cancel</Button></> : <>
        <Select onValueChange={(value) => value && setLanguage(value)} value={language}><SelectTrigger aria-label="Spoken language" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{languages.find((option) => option.value === language)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{languages.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
        <Button className={cn("w-full", transcript.length === 0 && "bg-cyan-400 text-slate-950 hover:bg-cyan-300")} onClick={createCaptions} variant={transcript.length > 0 ? "outline" : "default"}>{transcript.length > 0 ? "Create captions again" : "Create captions"}</Button>
      </>}
      {error ? <ToolStatus tone="error">{error}</ToolStatus> : null}
      {transcript.length > 0 ? <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox aria-label="Show captions on the video" checked={settings.enabled} onCheckedChange={(checked) => onSettingsChange({ ...settings, enabled: checked === true })} /> Show captions on the video</label> : null}
    </ToolSection>

    {transcript.length > 0 ? <>
      <ToolSection description="Pick a look. Move and resize the captions until they sit where you want." title="Caption style">
        <div className="grid grid-cols-3 gap-2">{captionStylePresets.map((preset) => <Button className={cn("border border-white/10 text-xs", settings.fontFamily === preset.change.fontFamily && settings.backgroundColor === preset.change.backgroundColor && "border-cyan-300 bg-cyan-300/10")} key={preset.value} onClick={() => onSettingsChange({ ...settings, ...preset.change })} size="sm" variant="ghost">{preset.label}</Button>)}</div>
        <EditorRangeControl label="Size" max={12} min={4} suffix="%" value={settings.sizePercent} onChange={(sizePercent) => onSettingsChange({ ...settings, sizePercent })} />
        <EditorRangeControl label="Height on screen" max={92} min={8} suffix="%" value={settings.verticalPositionPercent} onChange={(verticalPositionPercent) => onSettingsChange({ ...settings, verticalPositionPercent })} />
      </ToolSection>

      <ToolSection description="Cuts “um”, “uh”, and similar sounds out of the video. Speech recognition sometimes tidies these up, so it may not catch all of them." title="Remove filler words">
        {fillerCutCount > 0 ? <ToolStatus>Removed {fillerCutCount} filler {fillerCutCount === 1 ? "word" : "words"}. <button className="underline" onClick={() => onCutFillers([])} type="button">Put them back</button></ToolStatus> : <Button className="w-full" disabled={fillers.length === 0} onClick={() => onCutFillers(fillers)} variant="outline">{fillers.length === 0 ? "No filler words found" : `Remove ${fillers.length} filler ${fillers.length === 1 ? "word" : "words"}`}</Button>}
      </ToolSection>

      <ToolSection description="Edit your video like a document: click any word to cut it from the video. Click it again to bring it back." title="Edit by text">
        <div aria-label="Transcript" className="max-h-64 overflow-y-auto rounded-lg bg-black/20 p-3 text-sm leading-7">{transcript.map((word) => { const cut = isWordCut(word, playback); return <button aria-pressed={cut} className={cn("mr-1 rounded px-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300", cut ? "text-slate-600 line-through" : "text-slate-200", isFillerWord(word.text) && !cut && "text-amber-300")} key={word.id} onClick={() => onToggleWord(word)} type="button">{word.text}</button>; })}</div>
      </ToolSection>

      <ToolSection description="Download your captions as a file to upload on YouTube or elsewhere. Times match your finished video." title="Subtitle files">
        <div className="grid grid-cols-2 gap-2"><Button onClick={() => downloadSubtitles("srt")} size="sm" variant="outline">Download SRT</Button><Button onClick={() => downloadSubtitles("vtt")} size="sm" variant="outline">Download VTT</Button></div>
      </ToolSection>
    </> : null}
  </div>;
}
