"use client";

import { type CSSProperties, useCallback, useEffect, useRef } from "react";

import type { PlaybackSettings } from "@/features/project/playback-settings";

interface PlaybackVideoProps {
  ariaHidden?: boolean;
  className: string;
  isPlaying?: boolean;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  seekRequest?: { id: number; timeSeconds: number };
  sourceUrl: string;
  style?: CSSProperties;
}

export function PlaybackVideo({ ariaHidden = false, className, isPlaying = true, onPlaybackTimeChange, playback, seekRequest, sourceUrl, style }: PlaybackVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekToTrimStart = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = playback.trimStartSeconds;
    }
  }, [playback.trimStartSeconds]);

  useEffect(() => {
    seekToTrimStart();
  }, [seekToTrimStart, sourceUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playback.speed;
    }
  }, [playback.speed]);

  useEffect(() => {
    if (isPlaying) {
      void videoRef.current?.play().catch(() => undefined);
    } else {
      videoRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (seekRequest && videoRef.current) {
      videoRef.current.currentTime = seekRequest.timeSeconds;
    }
  }, [seekRequest]);

  return (
    <video
      aria-hidden={ariaHidden}
      autoPlay={false}
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
