"use client";

import { useState } from "react";
import { AudioLines, Music } from "lucide-react";

import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { ToolFileButton } from "@/components/atoms/tool-file-button";
import { ToolSection, ToolStatus } from "@/components/atoms/tool-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AudioSettings } from "@/features/audio/audio-settings";
import { createBeatCuts, detectBeats } from "@/features/audio/beat-detection";
import { detectSilentRanges, silenceSensitivities, type SilenceSensitivity } from "@/features/audio/silence-detection";
import { getMonoSamples, loadMusicAudio, loadSourceAudio } from "@/features/audio/source-audio";
import { countCuts, getCutSeconds, type ClipCut, type CutSource } from "@/features/project/clip-cuts";
import { createPlaybackSettings, type PlaybackSettings, type TimeRange } from "@/features/project/playback-settings";

interface CleanupPanelProps {
  audio: AudioSettings;
  cuts: ClipCut[];
  durationSeconds: number;
  onAudioChange(audio: AudioSettings): void;
  onCutsChange(source: CutSource, ranges: TimeRange[]): void;
  onPlaybackChange(change: Partial<PlaybackSettings>): void;
  playback: PlaybackSettings;
  sourceUrl: string;
}

const beatOptions = [
  { label: "Every 2 beats (fast)", value: "2" },
  { label: "Every 4 beats (steady)", value: "4" },
  { label: "Every 8 beats (relaxed)", value: "8" },
];
const seconds = (value: number) => `${value.toFixed(1)}s`;

export function CleanupPanel({ audio, cuts, durationSeconds, onAudioChange, onCutsChange, onPlaybackChange, playback, sourceUrl }: CleanupPanelProps) {
  const [beatsPerCut, setBeatsPerCut] = useState("4");
  const [busy, setBusy] = useState<"beats" | "silence">();
  const [error, setError] = useState<string>();
  const [sensitivity, setSensitivity] = useState<SilenceSensitivity>("balanced");
  const silenceCount = countCuts(cuts, "silence");
  const beatCount = countCuts(cuts, "beat");

  async function removeSilences() {
    setBusy("silence"); setError(undefined);
    const source = await loadSourceAudio(sourceUrl);
    if (!source) setError("This video has no sound Vertara can read, so there are no pauses to find.");
    else {
      const ranges = detectSilentRanges(getMonoSamples(source), source.sampleRate, sensitivity);
      onCutsChange("silence", ranges);
      if (ranges.length === 0) setError("No long pauses found at this setting. Try “Tight”.");
    }
    setBusy(undefined);
  }

  async function cutToBeat() {
    setBusy("beats"); setError(undefined);
    try {
      const buffer = audio.music ? await loadMusicAudio(audio.music.url) : await loadSourceAudio(sourceUrl);
      const analysis = buffer ? detectBeats(getMonoSamples(buffer), buffer.sampleRate) : undefined;
      if (!analysis) setError("No steady beat was found. Add a music track above and try again.");
      else onCutsChange("beat", createBeatCuts(analysis.beatSeconds, Number(beatsPerCut), createPlaybackSettings(durationSeconds, { ...playback, removedRanges: cuts.filter((cut) => cut.source !== "beat") })));
    } catch {
      setError("That music file could not be read.");
    }
    setBusy(undefined);
  }

  return <div className="space-y-3">
    <ToolSection description="Finds the quiet gaps where nobody is talking and cuts them out, so your video keeps moving." title="Remove pauses">
      <Select onValueChange={(value) => value && setSensitivity(value as SilenceSensitivity)} value={sensitivity}><SelectTrigger aria-label="How much to cut" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{silenceSensitivities.find((option) => option.value === sensitivity)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{silenceSensitivities.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}: {option.description}</SelectItem>)}</SelectContent></Select>
      <Button className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={busy !== undefined} onClick={removeSilences}>{busy === "silence" ? "Listening to your video…" : silenceCount > 0 ? "Find pauses again" : "Remove pauses"}</Button>
      {silenceCount > 0 ? <ToolStatus>Removed {silenceCount} {silenceCount === 1 ? "pause" : "pauses"} and saved {seconds(getCutSeconds(cuts, "silence"))}. <button className="underline" onClick={() => onCutsChange("silence", [])} type="button">Put them back</button></ToolStatus> : null}
    </ToolSection>

    <ToolSection description="Evens out your volume and reduces background hiss and rumble. Play the video to hear the difference." title="Improve my sound">
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm font-medium"><Checkbox aria-label="Clean up my sound" checked={audio.cleanup} onCheckedChange={(checked) => onAudioChange({ ...audio, cleanup: checked === true })} /> Clean up my sound</label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 text-sm font-medium"><Checkbox checked={playback.muted} onCheckedChange={(checked) => onPlaybackChange({ muted: checked === true })} /> <AudioLines className="size-4 text-slate-400" /> Mute original audio</label>
    </ToolSection>

    <ToolSection description="Add a song from your device. Vertara can lower it automatically whenever you speak. Only use music you have the rights to." title="Add music">
      <ToolFileButton accept="audio/*" onFile={(file) => { if (audio.music) URL.revokeObjectURL(audio.music.url); onAudioChange({ ...audio, music: { duck: true, name: file.name, url: URL.createObjectURL(file), volume: 0.5 } }); }}><Music className="size-4" />{audio.music ? "Choose a different song" : "Choose a song"}</ToolFileButton>
      {audio.music ? <>
        <p className="truncate text-xs text-slate-400" title={audio.music.name}>{audio.music.name}</p>
        <EditorRangeControl label="Music volume" suffix="%" value={audio.music.volume * 100} onChange={(volume) => audio.music && onAudioChange({ ...audio, music: { ...audio.music, volume: volume / 100 } })} />
        <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={audio.music.duck} onCheckedChange={(checked) => audio.music && onAudioChange({ ...audio, music: { ...audio.music, duck: checked === true } })} /> Lower the music when I speak</label>
        <Button className="w-full" onClick={() => { if (audio.music) URL.revokeObjectURL(audio.music.url); onAudioChange({ ...audio, music: undefined }); }} size="sm" variant="ghost">Remove music</Button>
      </> : null}
    </ToolSection>

    <ToolSection description="Makes quick jump cuts land exactly on the beat, for an energetic montage. Add music first. Without it, Vertara listens for a rhythm in your video's own sound." title="Cut to the beat">
      <Select onValueChange={(value) => value && setBeatsPerCut(value)} value={beatsPerCut}><SelectTrigger aria-label="How often to cut" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{beatOptions.find((option) => option.value === beatsPerCut)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{beatOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      <Button className="w-full" disabled={busy !== undefined} onClick={cutToBeat} variant="outline">{busy === "beats" ? "Finding the beat…" : beatCount > 0 ? "Cut again" : "Cut to the beat"}</Button>
      {beatCount > 0 ? <ToolStatus>Added {beatCount} beat cuts. <button className="underline" onClick={() => onCutsChange("beat", [])} type="button">Undo beat cuts</button></ToolStatus> : null}
    </ToolSection>

    {error ? <ToolStatus tone="error">{error}</ToolStatus> : null}
  </div>;
}
