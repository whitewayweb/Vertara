"use client";

import type { HookSettings } from "@/features/project/hook-settings";

interface HookSettingsPanelProps {
  onChange(settings: HookSettings): void;
  settings: HookSettings;
}

export function HookSettingsPanel({ onChange, settings }: HookSettingsPanelProps) {
  return (
    <aside aria-labelledby="hook-settings-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">First seconds</p>
      <h2 className="font-semibold" id="hook-settings-title">Opening hook</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add a bold message at the start of the trimmed video. A placeholder is shown in preview only until you enter text.</p>
      <div className="mt-5 space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm font-medium">
          Show opening hook
          <input
            aria-label="Show opening hook"
            checked={settings.enabled}
            onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
            type="checkbox"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Hook text
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
            disabled={!settings.enabled}
            maxLength={90}
            onChange={(event) => onChange({ ...settings, text: event.target.value })}
            placeholder="What should viewers notice first?"
            rows={3}
            value={settings.text}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Show for <span className="font-normal text-muted-foreground">{settings.durationSeconds.toFixed(1)} seconds</span>
          <input
            aria-label="Hook duration"
            disabled={!settings.enabled}
            max="5"
            min="0.5"
            onChange={(event) => onChange({ ...settings, durationSeconds: Number(event.target.value) })}
            step="0.5"
            type="range"
            value={settings.durationSeconds}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Font size <span className="font-normal text-muted-foreground">{settings.fontSizePercent}% of video width</span>
          <input
            aria-label="Hook font size"
            disabled={!settings.enabled}
            max="12"
            min="4"
            onChange={(event) => onChange({ ...settings, fontSizePercent: Number(event.target.value) })}
            step="1"
            type="range"
            value={settings.fontSizePercent}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Background colour
          <span className="flex items-center gap-3 font-normal text-muted-foreground">
            <input
              aria-label="Hook background colour"
              className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
              disabled={!settings.enabled}
              onChange={(event) => onChange({ ...settings, backgroundColor: event.target.value })}
              type="color"
              value={settings.backgroundColor}
            />
            {settings.backgroundColor.toUpperCase()}
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Placement
          <select
            disabled={!settings.enabled}
            onChange={(event) => onChange({ ...settings, position: event.target.value as HookSettings["position"] })}
            value={settings.position}
          >
            <option value="top">Top</option>
            <option value="center">Centre</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>
    </aside>
  );
}
