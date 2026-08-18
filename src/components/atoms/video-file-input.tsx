"use client";

import { type ChangeEvent, useId } from "react";

interface VideoFileInputProps {
  disabled?: boolean;
  onFileSelected(file: File): void;
}

export function VideoFileInput({ disabled = false, onFileSelected }: VideoFileInputProps) {
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.item(0);
    if (file) {
      onFileSelected(file);
    }

    event.currentTarget.value = "";
  }

  return (
    <label
      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
      htmlFor={inputId}
    >
      Choose a video
      <input
        accept="video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi,.mpeg,.mpg,.mts,.m2ts,.ts,.wmv,.flv,.3gp,.3g2"
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={handleChange}
        type="file"
      />
    </label>
  );
}
