"use client";

import { type CSSProperties, useCallback, useEffect, useRef } from "react";

import type { PlaybackSettings } from "@/features/project/playback-settings";

interface PlaybackVideoProps {
  ariaHidden?: boolean;
  className: string;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  sourceUrl: string;
  style?: CSSProperties;
}

export function PlaybackVideo({ ariaHidden = false, className, onPlaybackTimeChange, playback, sourceUrl, style }: PlaybackVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekToTrimStart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = playback.trimStartSeconds;
    }
  }, [playback.trimStartSeconds]);

  useEffect(() => {
    seekToTrimStart();
  }, [seekToTrimStart, sourceUrl]);

  return (
    <video
      aria-hidden={ariaHidden}
      autoPlay
      className={className}
      muted={playback.muted}
      onLoadedMetadata={seekToTrimStart}
      onTimeUpdate={() => {
        if (videoRef.current) {
          onPlaybackTimeChange?.(videoRef.current.currentTime);
        }
        if (videoRef.current && videoRef.current.currentTime >= playback.trimEndSeconds) {
          seekToTrimStart();
        }
      }}
      playsInline
      ref={videoRef}
      src={sourceUrl}
      style={style}
    />
  );
}
