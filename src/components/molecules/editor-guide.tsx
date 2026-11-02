import { Captions, Check, Crop, Download, Palette, Type, Wand2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type EditorTool = "brand" | "captions" | "cleanup" | "export" | "frame" | "text";

export const editorSteps: Array<{ description: string; icon: LucideIcon; id: EditorTool; title: string }> = [
  { id: "frame", icon: Crop, title: "Frame", description: "Fit your video to the screen" },
  { id: "cleanup", icon: Wand2, title: "Clean up", description: "Cut pauses, fix sound, add music" },
  { id: "captions", icon: Captions, title: "Captions", description: "Turn your speech into subtitles" },
  { id: "text", icon: Type, title: "Text", description: "Add hooks, titles, and emoji" },
  { id: "brand", icon: Palette, title: "Brand", description: "Add your logo and colours" },
  { id: "export", icon: Download, title: "Export", description: "Download for any platform" },
];

interface EditorGuideProps {
  activeTool: EditorTool;
  completedTools: ReadonlySet<EditorTool>;
  onSelect(tool: EditorTool): void;
}

/** The editor's map: a short path from top to bottom, where every step is optional. */
export function EditorGuide({ activeTool, completedTools, onSelect }: EditorGuideProps) {
  return <nav aria-label="Editing steps" className="flex gap-1 overflow-x-auto lg:flex-col">
    {editorSteps.map((step, index) => {
      const Icon = step.icon;
      const isActive = step.id === activeTool;
      return <button aria-current={isActive ? "step" : undefined} className={cn("flex min-w-44 items-start gap-2.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:min-w-0", isActive && "border-cyan-300/40 bg-cyan-300/10")} key={step.id} onClick={() => onSelect(step.id)} type="button">
        <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/15 text-xs text-slate-400", isActive && "border-cyan-300 text-cyan-200", completedTools.has(step.id) && "border-cyan-300 bg-cyan-300 text-slate-950")}>{completedTools.has(step.id) ? <Check className="size-3.5" /> : index + 1}</span>
        <span className="min-w-0"><span className="flex items-center gap-1.5 text-sm font-medium text-white"><Icon aria-hidden="true" className="size-3.5 text-slate-400" />{step.title}</span><span className="mt-0.5 block text-xs leading-4 text-slate-400">{step.description}</span></span>
      </button>;
    })}
  </nav>;
}
