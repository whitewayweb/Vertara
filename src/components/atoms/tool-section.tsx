import type { ReactNode } from "react";

interface ToolSectionProps {
  children: ReactNode;
  description: string;
  title: string;
}

/** One self-explaining tool: says what it does in plain words, then offers its controls. */
export function ToolSection({ children, description, title }: ToolSectionProps) {
  return <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"><div><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>{children}</section>;
}

export function ToolStatus({ children, tone = "success" }: { children: ReactNode; tone?: "error" | "progress" | "success" }) {
  const tones = { error: "border-red-400/30 bg-red-400/10 text-red-200", progress: "border-white/10 bg-black/20 text-slate-300", success: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" };
  return <div aria-live="polite" className={`rounded-lg border p-2.5 text-xs leading-5 ${tones[tone]}`}>{children}</div>;
}
