"use client";

import { useEffect, useRef } from "react";

import { musicDuckGain } from "@/features/audio/audio-processing";
import type { MusicTrack } from "@/features/audio/audio-settings";

interface MusicPreviewProps {
  isPlaying: boolean;
  isSpeaking: boolean;
  music: MusicTrack;
  outputSeconds: number;
}

/** Plays the music alongside the preview, kept in step with the finished video's timeline. */
export function MusicPreview({ isPlaying, isSpeaking, music, outputSeconds }: MusicPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) void audioRef.current.play().catch(() => undefined);
    else audioRef.current.pause();
  }, [isPlaying, music.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = music.volume * (music.duck && isSpeaking ? musicDuckGain : 1);
    const target = audio.duration ? outputSeconds % audio.duration : outputSeconds;
    if (Math.abs(audio.currentTime - target) > 0.35) audio.currentTime = target;
  }, [isSpeaking, music.duck, music.volume, outputSeconds]);

  return <audio aria-hidden="true" loop ref={audioRef} src={music.url} />;
}
