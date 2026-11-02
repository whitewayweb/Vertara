import { ToolSection, ToolStatus } from "@/components/atoms/tool-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extraExportFormats, outputPresets, type OutputPreset } from "@/features/project/output-settings";
import { getExportDurationSeconds, type PlaybackSettings } from "@/features/project/playback-settings";
import { formatTime } from "@/lib/format-time";

export interface ExportJobProgress {
  fileIndex: number;
  fileProgress: number;
  phase: "audio" | "video";
  totalFiles: number;
}

interface ExportPanelProps {
  error?: string;
  extraPresets: OutputPreset[];
  onCancel(): void;
  onExport(): void;
  onExtraPresetsChange(presets: OutputPreset[]): void;
  onPresetChange(preset: OutputPreset): void;
  playback: PlaybackSettings;
  preset: OutputPreset;
  progress?: ExportJobProgress;
}

export function ExportPanel({ error, extraPresets, onCancel, onExport, onExtraPresetsChange, onPresetChange, playback, preset, progress }: ExportPanelProps) {
  const formats = extraExportFormats.filter((format) => outputPresets[format.preset].label !== outputPresets[preset].label);
  const selectedExtras = extraPresets.filter((item) => formats.some((format) => format.preset === item));
  const fileCount = 1 + selectedExtras.length;

  return <div className="space-y-3">
    <ToolSection description="Pick where this video is going. The preview and size update to match." title="Main format">
      <Select onValueChange={(value) => value && onPresetChange(value)} value={preset}><SelectTrigger aria-label="Main export format" className="h-11 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{outputPresets[preset].destination} · {outputPresets[preset].label}</SelectValue></SelectTrigger><SelectContent className="max-h-72 min-w-[22rem] bg-[#1a1e25] text-slate-100">{Object.values(outputPresets).map((option) => <SelectItem className="py-2.5" key={option.preset} value={option.preset}>{option.destination} · {option.label}</SelectItem>)}</SelectContent></Select>
    </ToolSection>
    <ToolSection description="Get other shapes from the same edit in one go. Your browser may ask permission to download several files." title="Also make these">
      <div className="space-y-2">{formats.map((format) => <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-2.5 text-sm" key={format.preset}><Checkbox checked={selectedExtras.includes(format.preset)} onCheckedChange={(checked) => onExtraPresetsChange(checked === true ? [...selectedExtras, format.preset] : selectedExtras.filter((item) => item !== format.preset))} /><span><span className="block font-medium text-white">{format.title}</span><span className="block text-xs text-slate-400">{format.description}</span></span></label>)}</div>
    </ToolSection>
    <ToolSection description={`Your finished video is ${formatTime(getExportDurationSeconds(playback))} long and includes everything you added. It is created on this device and goes straight to your downloads.`} title="Ready when you are">
      {progress ? <><ToolStatus tone="progress">{progress.phase === "audio" ? "Preparing your sound…" : `Creating video ${progress.fileIndex} of ${progress.totalFiles}… ${Math.round(progress.fileProgress * 100)}%`}</ToolStatus><Button className="w-full" onClick={onCancel} variant="outline">Cancel</Button></> : <Button className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={onExport}>Export {fileCount} {fileCount === 1 ? "video" : "videos"}</Button>}
      {error ? <ToolStatus tone="error">{error}</ToolStatus> : null}
    </ToolSection>
  </div>;
}
