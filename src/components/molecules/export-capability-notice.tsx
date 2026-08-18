"use client";

import { useSyncExternalStore } from "react";

import {
  getBrowserExportCapability,
  type ExportCapability,
} from "@/features/media/export-capabilities";

export function ExportCapabilityNotice() {
  const capability = useSyncExternalStore<ExportCapability | undefined>(
    () => () => undefined,
    getBrowserExportCapability,
    () => undefined,
  );

  if (!capability || capability.level === "ready") {
    return null;
  }

  const isUnsupported = capability.level === "unsupported";

  return (
    <div
      aria-live="polite"
      className={
        isUnsupported
          ? "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          : "rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground"
      }
      role={isUnsupported ? "alert" : "status"}
    >
      {capability.message}
    </div>
  );
}
