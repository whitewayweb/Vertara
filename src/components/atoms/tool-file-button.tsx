import type { ReactNode } from "react";

interface ToolFileButtonProps {
  accept: string;
  children: ReactNode;
  onFile(file: File): void;
}

export function ToolFileButton({ accept, children, onFile }: ToolFileButtonProps) {
  return <label className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-white hover:bg-white/10 focus-within:ring-2 focus-within:ring-cyan-300">{children}<input accept={accept} className="sr-only" onChange={(event) => { const file = event.target.files?.item(0); if (file) onFile(file); event.target.value = ""; }} type="file" /></label>;
}
