interface SocialSafeAreaGuidesProps {
  visible: boolean;
}

export function SocialSafeAreaGuides({ visible }: SocialSafeAreaGuidesProps) {
  if (!visible) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] bottom-[20%] top-[8%] z-20 rounded border border-dashed border-white/65 shadow-[0_0_0_9999px_rgba(0,0,0,0.04)]"><span className="absolute -top-5 left-0 rounded bg-black/45 px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-wider text-white/75">Safe area</span></div>;
}
