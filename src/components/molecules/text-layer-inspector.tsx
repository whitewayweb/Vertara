"use client";

import { useRef } from "react";
import { ChevronDown, Copy, Plus, Sparkles, Trash2, Type } from "lucide-react";

import { EditorColorPicker } from "@/components/atoms/editor-color-picker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SavedTextStyle } from "@/features/brand/brand-kit";
import { textAlignmentOptions, textBackgroundStyleOptions, textEntranceAnimationOptions, textFontOptions, textOverlayTemplates, textStylePresets, type TextOverlay, type TextOverlayKind } from "@/features/project/text-overlays";
import { cn } from "@/lib/utils";

interface TextLayerInspectorProps {
  durationSeconds: number;
  onChange(id: string, change: Partial<TextOverlay>): void;
  onDelete(id: string): void;
  onDuplicate(id: string): void;
  onSaveStyle?(overlay: TextOverlay): void;
  onSelect(id: string): void;
  overlays: TextOverlay[];
  savedStyles?: SavedTextStyle[];
  selected?: TextOverlay;
}

interface TextLayerAddMenuProps {
  onAddSticker(sticker: string): void;
  onAddTemplate(template: Partial<TextOverlay>): void;
}

const kindLabels: Record<TextOverlayKind, string> = {
  cta: "CTA",
  hook: "Hook",
  quote: "Quote",
  sticker: "Sticker",
  text: "Text",
};

function KindTag({ kind }: { kind: TextOverlayKind }) {
  return <span className="rounded border border-white/15 px-1 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-slate-400">{kindLabels[kind]}</span>;
}

export function TextLayerAddMenu({ onAddSticker, onAddTemplate }: TextLayerAddMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const textTemplate = textOverlayTemplates.find((template) => template.kind === "text");
  function addText() {
    if (textTemplate) onAddTemplate(textTemplate);
    menuRef.current?.removeAttribute("open");
  }
  function addSticker() {
    onAddSticker("✨");
    menuRef.current?.removeAttribute("open");
  }
  return <details className="group relative" ref={menuRef}>
    <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-md bg-cyan-400 px-3 text-sm font-medium text-slate-950 marker:content-none hover:bg-cyan-300"><Plus className="size-4" /> Add text <ChevronDown className="size-3 transition-transform group-open:rotate-180" /></summary>
    <div className="absolute left-0 top-11 z-30 w-56 rounded-xl border border-white/15 bg-[#1b2028] p-2 shadow-2xl shadow-black/50">
      <Button className="h-auto w-full justify-between px-2 py-2 text-left hover:bg-white/10" onClick={addText} variant="ghost"><span><span className="block text-sm text-white">Text</span><span className="block text-xs text-slate-400">Add your message</span></span><Type className="size-4 text-cyan-300" /></Button>
      <Button className="h-auto w-full justify-between px-2 py-2 text-left hover:bg-white/10" onClick={addSticker} variant="ghost"><span><span className="block text-sm text-white">Sticker</span><span className="block text-xs text-slate-400">Add an emoji layer</span></span><Sparkles className="size-4 text-cyan-300" /></Button>
    </div>
  </details>;
}

const selectTriggerClass = "h-9 border-white/10 bg-black/20 text-xs text-white";

function InspectorSelect<T extends string>({ label, onChange, options, placeholder, value }: { label: string; onChange(value: T): void; options: ReadonlyArray<{ label: string; value: T }>; placeholder?: string; value?: T }) {
  return <Select onValueChange={(next) => next && onChange(next as T)} value={value}><SelectTrigger aria-label={label} className={selectTriggerClass}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

function InspectorColor({ ariaLabel, label, onChange, value }: { ariaLabel: string; label: string; onChange(value: string): void; value: string }) {
  return <label className="flex items-center justify-between gap-2 text-xs text-slate-400">{label} <EditorColorPicker label={ariaLabel} onChange={onChange} value={value} /></label>;
}

function InspectorSlider({ ariaLabel, label, max, min = 0, onChange, value }: { ariaLabel: string; label: string; max: number; min?: number; onChange(value: number): void; value: number }) {
  return <label className="flex items-center gap-2 text-xs text-slate-400">{label} <input aria-label={ariaLabel} className="min-w-0 flex-1 accent-cyan-300" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step="1" type="range" value={value} /></label>;
}

function StyleControls({ durationSeconds, onChange, selected }: Pick<TextLayerInspectorProps, "durationSeconds" | "onChange" | "selected">) {
  if (!selected) return null;
  const isSticker = selected.kind === "sticker";
  const isQuote = selected.kind === "quote";
  const isCta = selected.kind === "cta";
  const change = (partial: Partial<TextOverlay>) => onChange(selected.id, partial);
  return <>
    <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
      {!isSticker ? <InspectorSelect label="Text style preset" onChange={(value) => { const preset = textStylePresets.find((item) => item.value === value); if (preset) change(preset.change); }} options={textStylePresets} placeholder="Text style" /> : null}
      <InspectorColor ariaLabel="Text colour" label="Text colour" onChange={(color) => change({ color })} value={selected.color} />
      {!isQuote && !isSticker ? <InspectorColor ariaLabel="Text background colour" label={isCta ? "Button fill" : "Fill"} onChange={(backgroundColor) => change({ backgroundColor })} value={selected.backgroundColor} /> : null}
      {!isQuote && !isSticker ? <InspectorSelect label="Text background style" onChange={(backgroundStyle) => change({ backgroundStyle })} options={textBackgroundStyleOptions} value={selected.backgroundStyle} /> : null}
      {!isSticker ? <>
        <InspectorColor ariaLabel="Text stroke colour" label="Stroke" onChange={(strokeColor) => change({ strokeColor })} value={selected.strokeColor} />
        <InspectorSlider ariaLabel="Text stroke width" label="Stroke width" max={12} onChange={(strokeWidthPercent) => change({ strokeWidthPercent })} value={selected.strokeWidthPercent} />
        <InspectorColor ariaLabel="Text glow colour" label="Glow" onChange={(shadowColor) => change({ shadowColor })} value={selected.shadowColor} />
        <InspectorSlider ariaLabel="Text glow spread" label="Glow spread" max={30} onChange={(shadowSpreadPercent) => change({ shadowSpreadPercent })} value={selected.shadowSpreadPercent} />
        <InspectorColor ariaLabel="Drop shadow colour" label="Drop shadow" onChange={(dropShadowColor) => change({ dropShadowColor })} value={selected.dropShadowColor} />
        <InspectorSlider ariaLabel="Drop shadow blur" label="Shadow blur" max={30} onChange={(dropShadowBlurPercent) => change({ dropShadowBlurPercent })} value={selected.dropShadowBlurPercent} />
      </> : null}
      {!isSticker && !isCta ? <InspectorSelect label="Text font" onChange={(fontFamily) => change({ fontFamily })} options={textFontOptions} value={selected.fontFamily} /> : null}
      {!isSticker ? <InspectorSelect label="Text entrance" onChange={(entranceAnimation) => change({ entranceAnimation })} options={textEntranceAnimationOptions} value={selected.entranceAnimation} /> : null}
      <InspectorSlider ariaLabel="Text size" label="Size" max={12} min={4} onChange={(fontSizePercent) => change({ fontSizePercent })} value={selected.fontSizePercent} />
      {!isSticker ? <>
        <InspectorSelect label="Text alignment" onChange={(textAlign) => change({ textAlign })} options={textAlignmentOptions} value={selected.textAlign} />
        <InspectorSlider ariaLabel="Drop shadow horizontal offset" label="Shadow X" max={12} min={-12} onChange={(dropShadowOffsetXPercent) => change({ dropShadowOffsetXPercent })} value={selected.dropShadowOffsetXPercent} />
        <InspectorSlider ariaLabel="Drop shadow vertical offset" label="Shadow Y" max={12} min={-12} onChange={(dropShadowOffsetYPercent) => change({ dropShadowOffsetYPercent })} value={selected.dropShadowOffsetYPercent} />
      </> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><label className="space-y-1 text-xs text-slate-400">Starts at<input aria-label="Text start time" className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-white" max={durationSeconds} min="0" onChange={(event) => change({ startSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.startSeconds} /></label><label className="space-y-1 text-xs text-slate-400">On screen<input aria-label="Text duration" className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-white" max={Math.max(0.5, durationSeconds - selected.startSeconds)} min="0.5" onChange={(event) => change({ durationSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.durationSeconds} /></label></div>
  </>;
}

export function TextLayerInspector({ durationSeconds, onChange, onDelete, onDuplicate, onSaveStyle, onSelect, overlays, savedStyles = [], selected }: TextLayerInspectorProps) {
  return <div className="space-y-3"><div className="space-y-1" aria-label="Text layers" role="list">{overlays.map((overlay, index) => <Button aria-label={`Select layer ${index + 1}`} className={cn("h-10 w-full justify-start gap-2 truncate border border-transparent px-2 text-left text-xs", overlay.id === selected?.id ? "border-cyan-300 bg-cyan-300/10 text-cyan-50" : "bg-white/5 text-slate-300 hover:bg-white/10")} key={overlay.id} onClick={() => onSelect(overlay.id)} role="listitem" variant="ghost"><Type className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{overlay.text.trim() || `Text ${index + 1}`}</span><KindTag kind={overlay.kind} /></Button>)}</div>{selected ? <div className="space-y-3 border-t border-white/10 pt-3"><Textarea aria-label="Selected text" className="min-h-20 resize-none border-white/10 bg-black/20 text-white" maxLength={280} onChange={(event) => onChange(selected.id, { text: event.target.value })} placeholder="Write something" value={selected.text} />{savedStyles.length > 0 ? <InspectorSelect label="Saved looks" onChange={(id) => { const style = savedStyles.find((item) => item.id === id); if (style) onChange(selected.id, style.change); }} options={savedStyles.map((style) => ({ label: style.name, value: style.id }))} placeholder="Use a saved look" /> : null}<StyleControls durationSeconds={durationSeconds} onChange={onChange} selected={selected} /><div className="flex justify-end gap-1">{onSaveStyle ? <Button className="mr-auto text-xs" onClick={() => onSaveStyle(selected)} size="sm" variant="ghost">Save this look</Button> : null}<Button aria-label="Duplicate selected text" onClick={() => onDuplicate(selected.id)} size="icon-sm" variant="ghost"><Copy /></Button><Button aria-label="Delete selected text" className="hover:bg-red-400/15 hover:text-red-200" onClick={() => onDelete(selected.id)} size="icon-sm" variant="ghost"><Trash2 /></Button></div></div> : <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-slate-400">Use “Add text” above the preview to add a hook, title, or emoji, then drag it into place.</p>}</div>;
}
