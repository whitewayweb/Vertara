"use client";

import { type CSSProperties, useCallback, useEffect, useRef } from "react";

import { setPreviewCleanup } from "@/features/audio/preview-audio-graph";
import { getNextPlayableSeconds, type PlaybackSettings } from "@/features/project/playback-settings";
import type { BackgroundSettings } from "@/features/render/project-render";
import { createBackgroundCompositor } from "@/features/vision/background-compositor";
import { cn } from "@/lib/utils";

interface PlaybackVideoProps {
  background?: BackgroundSettings;
  className: string;
  cleanupAudio?: boolean;
  /** Decorative copies stay muted so the preview never plays the same sound twice. */
  decorative?: boolean;
  isPlaying?: boolean;
  onPlaybackTimeChange?(timeSeconds: number): void;
  playback: PlaybackSettings;
  seekRequest?: { id: number; timeSeconds: number };
  sourceUrl: string;
  style?: CSSProperties;
}

const previewCompositeWidth = 640;
const timeReportIntervalMilliseconds = 66;

export function PlaybackVideo({ background, className, cleanupAudio = false, decorative = false, isPlaying = true, onPlaybackTimeChange, playback, seekRequest, sourceUrl, style }: PlaybackVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTimeChangeRef = useRef(onPlaybackTimeChange);
  const backgroundMode = background?.mode ?? "off";
  const backgroundColor = background?.color;
  const hasBackground = backgroundMode !== "off";

  useEffect(() => {
    onTimeChangeRef.current = onPlaybackTimeChange;
  }, [onPlaybackTimeChange]);

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

  useEffect(() => {
    if (videoRef.current && !decorative) setPreviewCleanup(videoRef.current, cleanupAudio);
  }, [cleanupAudio, decorative]);

  // Cuts and word-by-word captions need finer timing than the 4Hz timeupdate event.
  useEffect(() => {
    if (!isPlaying) return;
    let frameRequest = 0;
    let lastReport = 0;
    const tick = (now: number) => {
      const video = videoRef.current;
      if (video && !video.seeking) {
        const next = getNextPlayableSeconds(video.currentTime, playback);
        if (Math.abs(next - video.currentTime) > 0.001) {
          video.currentTime = next;
          // A clip that reached the end of the file has stopped itself, so restart the loop.
          if (video.paused) void video.play().catch(() => undefined);
        }
        if (now - lastReport >= timeReportIntervalMilliseconds) {
          lastReport = now;
          onTimeChangeRef.current?.(next);
        }
      }
      frameRequest = requestAnimationFrame(tick);
    };
    frameRequest = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRequest);
  }, [isPlaying, playback]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!hasBackground || !video || !canvas || !backgroundColor) return;
    let isActive = true;
    let frameRequest = 0;
    let closeCompositor: (() => void) | undefined;
    void createBackgroundCompositor({ color: backgroundColor, mode: backgroundMode }, previewCompositeWidth, canvas).then((compositor) => {
      closeCompositor = compositor.close;
      if (!isActive) return compositor.close();
      const draw = () => {
        if (!isActive) return;
        if (video.readyState >= 2) compositor.compose(video);
        frameRequest = video.requestVideoFrameCallback(draw);
      };
      if (video.readyState >= 2) compositor.compose(video);
      frameRequest = video.requestVideoFrameCallback(draw);
    }).catch(() => undefined);
    return () => {
      isActive = false;
      video.cancelVideoFrameCallback(frameRequest);
      closeCompositor?.();
    };
  }, [backgroundColor, backgroundMode, hasBackground]);

  return (
    <>
      <video
        aria-hidden={decorative}
        autoPlay={false}
        className={cn(className, hasBackground && "invisible")}
        muted={decorative || playback.muted}
        onLoadedMetadata={(event) => {
          // A preview recreated by changing step resumes where the last one was asked to be.
          event.currentTarget.currentTime = Math.max(seekRequest?.timeSeconds ?? 0, playback.trimStartSeconds);
          if (isPlaying) void event.currentTarget.play().catch(() => undefined);
        }}
        onSeeked={(event) => onTimeChangeRef.current?.(event.currentTarget.currentTime)}
        playsInline
        ref={videoRef}
        src={sourceUrl}
        style={style}
      />
      {hasBackground ? <canvas aria-hidden="true" className={cn(className, "absolute inset-0")} ref={canvasRef} style={style} /> : null}
    </>
  );
}
