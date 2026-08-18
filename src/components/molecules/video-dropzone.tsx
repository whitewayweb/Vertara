"use client";

import { type DragEvent, useState } from "react";

import { VideoFileInput } from "@/components/atoms/video-file-input";
import { cn } from "@/lib/utils";

interface VideoDropzoneProps {
  disabled?: boolean;
  onFileSelected(file: File): void;
}

export function VideoDropzone({ disabled = false, onFileSelected }: VideoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files.item(0);
    if (file) {
      onFileSelected(file);
    }
  }

  return (
    <div
      className={cn(
        "grid min-h-56 place-items-center rounded-xl border border-dashed border-white/20 bg-black/20 p-6 text-center text-slate-100 transition-colors",
        isDragging && "border-cyan-300 bg-cyan-400/10",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="space-y-3">
        <div>
          <p className="font-medium">Drop a video here</p>
          <p className="text-sm text-slate-400">
            MP4 and WebM work across modern browsers. MOV is supported in Safari when its codec is compatible.
          </p>
        </div>
        <VideoFileInput disabled={disabled} onFileSelected={onFileSelected} />
      </div>
    </div>
  );
}
