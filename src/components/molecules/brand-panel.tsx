import { ImagePlus } from "lucide-react";

import { EditorColorPicker } from "@/components/atoms/editor-color-picker";
import { EditorRangeControl } from "@/components/atoms/editor-range-control";
import { ToolFileButton } from "@/components/atoms/tool-file-button";
import { ToolSection, ToolStatus } from "@/components/atoms/tool-section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logoCornerOptions, type BrandKit, type LogoCorner } from "@/features/brand/brand-kit";
import { textFontOptions, type TextOverlay } from "@/features/project/text-overlays";

interface BrandPanelProps {
  kit: BrandKit;
  onApply(): void;
  onChange(kit: BrandKit): void;
  overlayCount: number;
}

const maximumLogoBytes = 1_500_000;

export function BrandPanel({ kit, onApply, onChange, overlayCount }: BrandPanelProps) {
  function readLogo(file: File) {
    if (file.size > maximumLogoBytes) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") onChange({ ...kit, logoDataUrl: reader.result }); };
    reader.readAsDataURL(file);
  }

  return <div className="space-y-3">
    <ToolStatus tone="progress">Your brand kit is saved in this browser, so it is ready every time you come back.</ToolStatus>
    <ToolSection description="Shows on every video you export. A PNG with a transparent background looks best (1.5 MB or smaller)." title="Your logo">
      <ToolFileButton accept="image/png,image/jpeg,image/webp" onFile={readLogo}><ImagePlus className="size-4" />{kit.logoDataUrl ? "Change logo" : "Add your logo"}</ToolFileButton>
      {kit.logoDataUrl ? <>
        <Select onValueChange={(value) => value && onChange({ ...kit, logoCorner: value as LogoCorner })} value={kit.logoCorner}><SelectTrigger aria-label="Logo position" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{logoCornerOptions.find((option) => option.value === kit.logoCorner)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{logoCornerOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
        <EditorRangeControl label="Logo size" max={30} min={6} suffix="%" value={kit.logoSizePercent} onChange={(logoSizePercent) => onChange({ ...kit, logoSizePercent })} />
        <Button className="w-full" onClick={() => onChange({ ...kit, logoDataUrl: undefined })} size="sm" variant="ghost">Remove logo</Button>
      </> : null}
    </ToolSection>
    <ToolSection description="New text and captions start with these, so your videos look like they belong together." title="Your colours and font">
      <label className="flex items-center justify-between text-sm text-slate-200">Text colour <EditorColorPicker label="Brand text colour" onChange={(textColor) => textColor !== "transparent" && onChange({ ...kit, textColor })} value={kit.textColor} /></label>
      <label className="flex items-center justify-between text-sm text-slate-200">Highlight colour <EditorColorPicker label="Brand highlight colour" onChange={(accentColor) => accentColor !== "transparent" && onChange({ ...kit, accentColor })} value={kit.accentColor} /></label>
      <Select onValueChange={(value) => value && onChange({ ...kit, fontFamily: value as TextOverlay["fontFamily"] })} value={kit.fontFamily}><SelectTrigger aria-label="Brand font" className="h-10 w-full border-white/10 bg-black/20 text-left text-white"><SelectValue>{textFontOptions.find((option) => option.value === kit.fontFamily)?.label}</SelectValue></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textFontOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      <Button className="w-full" onClick={onApply} variant="outline">Use on this video{overlayCount > 0 ? ` (${overlayCount} text ${overlayCount === 1 ? "layer" : "layers"} + captions)` : " (captions)"}</Button>
    </ToolSection>
    {kit.savedStyles.length > 0 ? <ToolSection description="Looks you saved from the Text step. Pick one there to reuse it." title="Saved text looks">
      <ul className="space-y-1">{kit.savedStyles.map((style) => <li className="flex items-center justify-between gap-2 text-sm text-slate-200" key={style.id}><span className="truncate">{style.name}</span><Button onClick={() => onChange({ ...kit, savedStyles: kit.savedStyles.filter((item) => item.id !== style.id) })} size="sm" variant="ghost">Remove</Button></li>)}</ul>
    </ToolSection> : null}
  </div>;
}
