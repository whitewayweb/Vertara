import { getOutputElapsedSeconds, type PlaybackSettings, type TimeRange } from "@/features/project/playback-settings";
import type { TextOverlay } from "@/features/project/text-overlays";

export interface TranscriptWord extends TimeRange {
  id: string;
  text: string;
}

export interface CaptionLine extends TimeRange {
  words: TranscriptWord[];
}

export interface CaptionSettings {
  backgroundColor: string;
  color: string;
  enabled: boolean;
  fontFamily: TextOverlay["fontFamily"];
  highlightColor: string;
  sizePercent: number;
  verticalPositionPercent: number;
}

export const captionStylePresets = [
  { label: "Pop", value: "pop", change: { backgroundColor: "transparent", color: "#ffffff", fontFamily: "headline", highlightColor: "#facc15" } },
  { label: "Clean", value: "clean", change: { backgroundColor: "transparent", color: "#ffffff", fontFamily: "modern", highlightColor: "#ffffff" } },
  { label: "Boxed", value: "boxed", change: { backgroundColor: "#000000cc", color: "#ffffff", fontFamily: "rounded", highlightColor: "#22d3ee" } },
] as const satisfies ReadonlyArray<{ change: Partial<CaptionSettings>; label: string; value: string }>;

export const defaultCaptionSettings: CaptionSettings = { ...captionStylePresets[0].change, enabled: false, sizePercent: 7, verticalPositionPercent: 72 };

const fillerWords = new Set(["um", "umm", "uh", "uhh", "uhm", "erm", "er", "ah", "ahh", "hmm", "hm", "mm", "mmm"]);
const maximumLineCharacters = 24;
const maximumLineWords = 5;
const maximumWordGapSeconds = 0.7;
const normalizeWord = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function isFillerWord(text: string): boolean {
  return fillerWords.has(normalizeWord(text));
}

/** A word counts as cut only when almost none of it survives, because speech recognition often stretches a word's timing into the pause after it. */
export function isWordCut(word: TimeRange, playback: PlaybackSettings): boolean {
  const start = Math.max(word.startSeconds, playback.trimStartSeconds);
  const end = Math.min(word.endSeconds, playback.trimEndSeconds);
  const removedSeconds = playback.removedRanges.reduce((total, range) => total + Math.max(0, Math.min(end, range.endSeconds) - Math.max(start, range.startSeconds)), 0);
  const keptSeconds = end - start - removedSeconds;
  return keptSeconds < Math.min(0.1, (word.endSeconds - word.startSeconds) / 2);
}

/** Groups the words still in the video into short lines that read well on a phone. */
export function createCaptionLines(words: TranscriptWord[], playback: PlaybackSettings): CaptionLine[] {
  const lines: CaptionLine[] = [];
  for (const word of words) {
    if (isWordCut(word, playback)) continue;
    const line = lines.at(-1);
    const nextLength = line ? line.words.reduce((total, item) => total + item.text.length + 1, 0) + word.text.length : 0;
    const endsSentence = line ? /[.!?]$/.test(line.words.at(-1)?.text ?? "") : false;
    if (line && !endsSentence && nextLength <= maximumLineCharacters && line.words.length < maximumLineWords && getKeptGapSeconds(line.endSeconds, word.startSeconds, playback) <= maximumWordGapSeconds) {
      line.words.push(word);
      line.endSeconds = word.endSeconds;
    } else {
      lines.push({ endSeconds: word.endSeconds, startSeconds: word.startSeconds, words: [word] });
    }
  }
  return lines;
}

// Measured in the finished video, so a cut between two words does not split their line.
function getKeptGapSeconds(fromSeconds: number, toSeconds: number, playback: PlaybackSettings): number {
  const toElapsed = (seconds: number) => getOutputElapsedSeconds(seconds - playback.trimStartSeconds, playback);
  return (toElapsed(toSeconds) - toElapsed(fromSeconds)) * playback.speed;
}

export function getActiveCaption(lines: CaptionLine[], sourceSeconds: number): { activeWordId?: string; line: CaptionLine } | undefined {
  const line = lines.find((item) => sourceSeconds >= item.startSeconds && sourceSeconds < item.endSeconds + 0.15);
  if (!line) return undefined;
  const activeWord = line.words.find((word) => sourceSeconds >= word.startSeconds && sourceSeconds < word.endSeconds) ?? [...line.words].reverse().find((word) => sourceSeconds >= word.startSeconds);
  return { activeWordId: activeWord?.id, line };
}

export function createSubtitleFile(words: TranscriptWord[], playback: PlaybackSettings, format: "srt" | "vtt"): string {
  const lines = createCaptionLines(words, playback);
  const separator = format === "srt" ? "," : ".";
  const cues = lines.map((line, index) => {
    const start = formatSubtitleTime(getOutputElapsedSeconds(line.startSeconds - playback.trimStartSeconds, playback), separator);
    const end = formatSubtitleTime(getOutputElapsedSeconds(line.endSeconds - playback.trimStartSeconds, playback), separator);
    const body = `${start} --> ${end}\n${line.words.map((word) => word.text).join(" ")}\n`;
    return format === "srt" ? `${index + 1}\n${body}` : body;
  });
  return `${format === "vtt" ? "WEBVTT\n\n" : ""}${cues.join("\n")}`;
}

function formatSubtitleTime(seconds: number, separator: string): string {
  const totalMilliseconds = Math.round(seconds * 1000);
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return `${pad(Math.floor(totalMilliseconds / 3_600_000))}:${pad(Math.floor(totalMilliseconds / 60_000) % 60)}:${pad(Math.floor(totalMilliseconds / 1000) % 60)}${separator}${pad(totalMilliseconds % 1000, 3)}`;
}
