"use client";

import {
  Button as AriaButton,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Input,
  Popover,
  parseColor,
  SliderTrack,
} from "react-aria-components";

interface EditorColorPickerProps {
  label: string;
  onChange(value: string): void;
  value: string;
}

function toPickerValue(value: string): string {
  return value === "transparent" ? "#00000000" : value;
}

function toStoredValue(value: string): string {
  return value.endsWith("00") ? "transparent" : value;
}

export function EditorColorPicker({ label, onChange, value }: EditorColorPickerProps) {
  return <ColorPicker onChange={(color) => onChange(toStoredValue(color.toString("hexa").toLowerCase()))} value={parseColor(toPickerValue(value))}>
    <DialogTrigger>
      <AriaButton aria-label={label} className="group flex size-10 items-center justify-center rounded-lg border border-white/10 bg-black/20 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-300">
        <ColorSwatch className="size-6 rounded border border-white/20 shadow-inner" />
      </AriaButton>
      <Popover className="z-50 mt-2 rounded-xl border border-white/15 bg-[#20242b] p-3 text-slate-100 shadow-2xl shadow-black/50">
        <Dialog aria-label={`${label} picker`} className="grid w-60 gap-3 outline-none">
          <ColorArea aria-label={label} colorSpace="hsb" xChannel="saturation" yChannel="brightness" className="relative h-36 rounded-lg [&_.react-aria-ColorThumb]:size-4 [&_.react-aria-ColorThumb]:rounded-full [&_.react-aria-ColorThumb]:border-2 [&_.react-aria-ColorThumb]:border-white [&_.react-aria-ColorThumb]:shadow">
            <ColorThumb />
          </ColorArea>
          <ColorSlider channel="hue" colorSpace="hsb" className="h-4"><SliderTrack className="relative h-full rounded-full [&_.react-aria-ColorThumb]:size-4 [&_.react-aria-ColorThumb]:rounded-full [&_.react-aria-ColorThumb]:border-2 [&_.react-aria-ColorThumb]:border-white [&_.react-aria-ColorThumb]:shadow" style={{ background: "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))" }}><ColorThumb /></SliderTrack></ColorSlider>
          <ColorSlider channel="alpha" className="h-4"><SliderTrack className="relative h-full rounded-full bg-[linear-gradient(45deg,#64748b_25%,transparent_25%),linear-gradient(-45deg,#64748b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#64748b_75%),linear-gradient(-45deg,transparent_75%,#64748b_75%)] bg-[length:8px_8px] bg-[position:0_0,0_4px,4px_-4px,-4px_0px] [&_.react-aria-ColorThumb]:size-4 [&_.react-aria-ColorThumb]:rounded-full [&_.react-aria-ColorThumb]:border-2 [&_.react-aria-ColorThumb]:border-white [&_.react-aria-ColorThumb]:shadow"><ColorThumb /></SliderTrack></ColorSlider>
          <div className="flex items-center gap-2 text-xs text-slate-400"><span>HEX</span><ColorField className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-sm text-white"><Input className="w-full bg-transparent outline-none" /></ColorField></div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  </ColorPicker>;
}
