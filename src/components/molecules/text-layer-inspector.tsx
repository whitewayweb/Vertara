"use client";

import { ChevronDown, Copy, Plus, Trash2, Type } from "lucide-react";

import { EditorColorPicker } from "@/components/atoms/editor-color-picker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { textAlignmentOptions, textEntranceAnimationOptions, textFontOptions, textOverlayTemplates, type TextOverlay, type TextOverlayKind } from "@/features/project/text-overlays";
import { cn } from "@/lib/utils";

interface TextLayerInspectorProps {
  durationSeconds: number;
  onAddSticker(sticker: string): void;
  onAddTemplate(template: Partial<TextOverlay>): void;
  onChange(id: string, change: Partial<TextOverlay>): void;
  onDelete(id: string): void;
  onDuplicate(id: string): void;
  onSelect(id: string): void;
  overlays: TextOverlay[];
  selected?: TextOverlay;
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

function AddTextMenu({ onAddSticker, onAddTemplate }: Pick<TextLayerInspectorProps, "onAddSticker" | "onAddTemplate">) {
  return <details className="group relative">
    <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-md bg-cyan-400 px-3 text-sm font-medium text-slate-950 marker:content-none hover:bg-cyan-300"><Plus className="size-4" /> Add text <ChevronDown className="size-3 transition-transform group-open:rotate-180" /></summary>
    <div className="absolute left-0 top-11 z-30 w-64 rounded-xl border border-white/15 bg-[#1b2028] p-2 shadow-2xl shadow-black/50">
      <p className="px-2 pb-1 pt-0.5 text-xs font-medium text-slate-400">Add a layer</p>
      {textOverlayTemplates.map((template) => <Button className="h-auto w-full justify-between px-2 py-2 text-left hover:bg-white/10" key={template.label} onClick={() => onAddTemplate(template)} variant="ghost"><span><span className="block text-sm text-white">{template.label}</span><span className="block text-xs text-slate-400">{template.text}</span></span><Plus className="size-4 text-cyan-300" /></Button>)}
      <div className="mt-1 border-t border-white/10 pt-1"><p className="px-2 py-1 text-xs font-medium text-slate-400">Sticker</p><div className="flex gap-1 px-1">{["✨", "🔥", "😍", "💯", "🎉"].map((sticker) => <Button aria-label={`Add ${sticker} sticker`} className="size-8 text-base" key={sticker} onClick={() => onAddSticker(sticker)} size="icon-sm" variant="ghost">{sticker}</Button>)}</div></div>
    </div>
  </details>;
}

function StyleControls({ durationSeconds, onChange, selected }: Pick<TextLayerInspectorProps, "durationSeconds" | "onChange" | "selected">) {
  if (!selected) return null;
  const isSticker = selected.kind === "sticker";
  const isQuote = selected.kind === "quote";
  const isCta = selected.kind === "cta";
  return <>
    <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
      <label className="flex items-center justify-between gap-2 text-xs text-slate-400">Text colour <EditorColorPicker label="Text colour" onChange={(color) => onChange(selected.id, { color })} value={selected.color} /></label>
      {!isQuote && !isSticker ? <label className="flex items-center justify-between gap-2 text-xs text-slate-400">{isCta ? "Button fill" : "Fill"} <EditorColorPicker label="Text background colour" onChange={(backgroundColor) => onChange(selected.id, { backgroundColor })} value={selected.backgroundColor} /></label> : null}
      {!isSticker && !isCta ? <Select onValueChange={(value) => value && onChange(selected.id, { fontFamily: value as TextOverlay["fontFamily"] })} value={selected.fontFamily}><SelectTrigger aria-label="Text font" className="h-9 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textFontOptions.map((font) => <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>)}</SelectContent></Select> : null}
      {!isSticker ? <Select onValueChange={(value) => value && onChange(selected.id, { entranceAnimation: value as TextOverlay["entranceAnimation"] })} value={selected.entranceAnimation}><SelectTrigger aria-label="Text entrance" className="h-9 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textEntranceAnimationOptions.map((animation) => <SelectItem key={animation.value} value={animation.value}>{animation.label}</SelectItem>)}</SelectContent></Select> : null}
      <label className="flex items-center gap-2 text-xs text-slate-400">Size <input aria-label="Text size" className="min-w-0 flex-1 accent-cyan-300" max="12" min="4" onChange={(event) => onChange(selected.id, { fontSizePercent: Number(event.target.value) })} step="1" type="range" value={selected.fontSizePercent} /></label>
      {!isSticker ? <Select onValueChange={(value) => value && onChange(selected.id, { textAlign: value as TextOverlay["textAlign"] })} value={selected.textAlign}><SelectTrigger aria-label="Text alignment" className="h-9 border-white/10 bg-black/20 text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1a1e25] text-slate-100">{textAlignmentOptions.map((alignment) => <SelectItem key={alignment.value} value={alignment.value}>{alignment.label}</SelectItem>)}</SelectContent></Select> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><label className="space-y-1 text-xs text-slate-400">Starts at<input aria-label="Text start time" className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-white" max={durationSeconds} min="0" onChange={(event) => onChange(selected.id, { startSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.startSeconds} /></label><label className="space-y-1 text-xs text-slate-400">On screen<input aria-label="Text duration" className="h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-white" max={Math.max(0.5, durationSeconds - selected.startSeconds)} min="0.5" onChange={(event) => onChange(selected.id, { durationSeconds: Number(event.target.value) })} step="0.5" type="number" value={selected.durationSeconds} /></label></div>
  </>;
}

export function TextLayerInspector({ durationSeconds, onAddSticker, onAddTemplate, onChange, onDelete, onDuplicate, onSelect, overlays, selected }: TextLayerInspectorProps) {
  return <div className="space-y-3 p-5"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Text</h2><AddTextMenu onAddSticker={onAddSticker} onAddTemplate={onAddTemplate} /></div><div className="space-y-1" aria-label="Text layers" role="list">{overlays.map((overlay, index) => <Button aria-label={`Select layer ${index + 1}`} className={cn("h-10 w-full justify-start gap-2 truncate border border-transparent px-2 text-left text-xs", overlay.id === selected?.id ? "border-cyan-300 bg-cyan-300/10 text-cyan-50" : "bg-white/5 text-slate-300 hover:bg-white/10")} key={overlay.id} onClick={() => onSelect(overlay.id)} role="listitem" variant="ghost"><Type className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{overlay.text.trim() || `Text ${index + 1}`}</span><KindTag kind={overlay.kind} /></Button>)}</div>{selected ? <div className="space-y-3 border-t border-white/10 pt-3"><Textarea aria-label="Selected text" className="min-h-20 resize-none border-white/10 bg-black/20 text-white" maxLength={280} onChange={(event) => onChange(selected.id, { text: event.target.value })} placeholder="Write something" value={selected.text} /><StyleControls durationSeconds={durationSeconds} onChange={onChange} selected={selected} /><div className="flex justify-end gap-1"><Button aria-label="Duplicate selected text" onClick={() => onDuplicate(selected.id)} size="icon-sm" variant="ghost"><Copy /></Button><Button aria-label="Delete selected text" className="hover:bg-red-400/15 hover:text-red-200" onClick={() => onDelete(selected.id)} size="icon-sm" variant="ghost"><Trash2 /></Button></div></div> : <p className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-slate-400">Choose a layer or add one to begin.</p>}</div>;
}
