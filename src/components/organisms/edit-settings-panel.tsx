"use client";

import type { PlaybackSettings } from "@/features/project/playback-settings";

interface EditSettingsPanelProps {
  durationSeconds: number;
  onChange(settings: PlaybackSettings): void;
  settings: PlaybackSettings;
}

function formatTime(seconds: number): string {
  const roundedSeconds = Math.round(seconds);
  return `${Math.floor(roundedSeconds / 60)}:${(roundedSeconds % 60).toString().padStart(2, "0")}`;
}

export function EditSettingsPanel({ durationSeconds, onChange, settings }: EditSettingsPanelProps) {
  const minimumDuration = Math.min(0.1, durationSeconds);

  return (
    <aside aria-labelledby="edit-settings-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">Project settings</p>
      <h2 className="font-semibold" id="edit-settings-title">Trim and audio</h2>
      <div className="mt-5 space-y-5">
        <label className="grid gap-2 text-sm font-medium">
          Starts at <span className="font-normal text-muted-foreground">{formatTime(settings.trimStartSeconds)}</span>
          <input
            aria-label="Trim start"
            max={Math.max(0, settings.trimEndSeconds - minimumDuration)}
            min="0"
            onChange={(event) => onChange({ ...settings, trimStartSeconds: Number(event.target.value) })}
            step="0.1"
            type="range"
            value={settings.trimStartSeconds}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Ends at <span className="font-normal text-muted-foreground">{formatTime(settings.trimEndSeconds)}</span>
          <input
            aria-label="Trim end"
            max={durationSeconds}
            min={Math.min(durationSeconds, settings.trimStartSeconds + minimumDuration)}
            onChange={(event) => onChange({ ...settings, trimEndSeconds: Number(event.target.value) })}
            step="0.1"
            type="range"
            value={settings.trimEndSeconds}
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm font-medium">
          Mute original audio
          <input
            aria-label="Mute original audio"
            checked={settings.muted}
            onChange={(event) => onChange({ ...settings, muted: event.target.checked })}
            type="checkbox"
          />
        </label>
      </div>
    </aside>
  );
}
