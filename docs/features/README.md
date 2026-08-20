# Vertara feature catalogue

This is the implementation-oriented feature reference for people and AI tools. It records what is implemented now, where its source of truth lives, and what is deliberately not implemented. Read this with [`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md): this catalogue describes current behaviour; the plan describes delivery scope and future work.

## Non-negotiable product constraints

- Source video stays on the creator's device. Do not add uploads, remote media processing, media analytics, or third-party processing without explicit approval.
- The editor runs in browser-facing client components. Keep browser APIs out of server-rendered modules.
- Preview rendering and MP4 export are separate paths. UI components pass feature state to export interfaces; they do not call encoders directly.
- Treat `src/components/ui` as shadcn-managed source. Build product behaviour in atoms, molecules, or organisms instead.

## Implemented features

| Feature | User-facing behaviour | Source of truth | Export coverage |
| --- | --- | --- | --- |
| Local import and inspection | Pick or drop MP4/WebM; MOV works only when the browser can decode it. Metadata is checked with a 10-second timeout and clear errors. | `features/media/inspect-media.ts`, `components/organisms/import-panel.tsx` | Input only |
| Canvas layout | Contained source video over a blurred, dimmed backdrop; blur, backdrop intensity, and dim are adjustable. | `features/render/canvas-layout.ts` | Yes |
| Focus layout | Cover crop for the output frame; horizontal position and zoom are adjustable. | `features/render/focus-layout.ts` | Yes |
| Poster layout | Gradient story card with editable headline and subline plus contained video. | `features/render/poster-layout.ts` | Yes |
| Visual framing choices | Compare the same local footage as three real vertical Canvas, Focus, and Poster previews. Choosing a treatment selects that existing mode and advances to the Text surface; it does not add a second duplicate preview. | `components/molecules/frame-choice-card.tsx`, `components/molecules/editor-preview-stage.tsx`, `components/organisms/layout-editor.tsx` | Uses existing layout modes; yes |
| Playback and timeline | Explicit play/pause, mute toggle, trim-bounded looping, and clickable seeking. | `features/project/playback-settings.ts`, `components/atoms/playback-video.tsx`, `components/molecules/editor-timeline.tsx` | Trim and speed affect export; audio is not yet muxed |
| Speed | 1×–5× in 0.5× steps, with a live output-duration estimate. | [`video-speed.md`](video-speed.md) | Yes; see linked feature spec |
| Text overlays and emoji stickers | Add any number of independently timed text layers or local emoji stickers from the Add text menu in the Edit preview header. Start from Text, Hook, Quote, or CTA templates; the new layer is selected on the video and the existing right sidebar opens only the controls applicable to that layer type. Every layer supports editable text, foreground colour, optional transparent background where relevant, social-friendly type styles, left/centre/right alignment where relevant, entrance motion, size, draggable in-video position, edge-resizable width, duplicate, delete, and a readable text timing lane. Blank layers are not exported. | `features/project/text-overlays.ts`, `components/molecules/text-layer-inspector.tsx`, `components/molecules/text-layer-timeline.tsx`, `components/molecules/video-hook-overlay.tsx` | Yes |
| Text-layer history | Undo and redo text or emoji layer edits with toolbar buttons or ⌘/Ctrl+Z and ⇧⌘/Ctrl+Z outside editable fields. | `features/project/edit-history.ts` | Editor state only |
| Social safe-area guides | Toggle an output-format-aware text-safe region while editing. Vertical output keeps the guide close to the boundary while reserving extra bottom clearance; square and landscape use a compact symmetric inset. The guide is independent of Canvas, Focus, or Poster. | `components/atoms/social-safe-area-guides.tsx` | Preview only; never exported |
| Colour adjustments | Tune bounded brightness, contrast, saturation, and warmth values. | `features/render/video-adjustments.ts` | Yes, in every layout |
| Output presets | Social-destination dimensions selected from one registry. | `features/project/output-settings.ts` | Yes |
| Browser-only MP4 export | H.264/WebCodecs export, progress, cancellation, automatic download, and cleanup. Device capability is checked before use. | `features/export/local-mp4-exporter.ts`, `features/export/export-capabilities.ts` | This is the export implementation |

## Important behaviour and extension rules

### Import

Accepted extensions are MP4, WebM, and MOV. Extension/MIME validation is only an early check; successful browser metadata loading is the actual acceptance criterion. Preserve object-URL cleanup when changing import flow. The imported `File` is not persisted.

### Shared playback state

`PlaybackSettings` owns trim start, trim end, mute, and speed. Validate updates through `createPlaybackSettings()` rather than writing partial values to UI state. Trim bounds are source time; the timeline therefore remains in source time even when preview runs faster.

### Layouts and preview/export parity

Layout-specific settings are pure feature state with bounded constructors. Any new visual setting needs both a preview implementation and an export-renderer implementation before it can be described as exported. Keep Canvas, Focus, and Poster selection in the `ExportLayoutMode` union.

The visual framing choices are a presentation of that union, not a separate layout state. Keep their labels and treatments in the same local registry used by `LayoutEditor`; the inspector should only expose settings for the selected mode.

### Output presets

Add or change destinations only through `outputPresets`; do not duplicate dimensions in UI components or the exporter. The current registry is product metadata, not a claim that Vertara publishes directly to those platforms.

### Export limitations

- Video-only MP4 is implemented. Source audio is currently not muxed, even though preview mute is part of shared playback state.
- WebCodecs/H.264 support varies by browser and device. Unsupported configurations must fail clearly and locally.
- The current renderer is a fixed-rate canvas export; its exact source-frame caveat is documented in [`video-speed.md`](video-speed.md).
- Export runs on the device and can be cancelled. Do not move this work to a server.

## Required change checklist

1. Update the relevant feature spec or this catalogue in the same change.
2. Update `IMPLEMENTATION_PLAN.md` if behaviour, architecture, privacy posture, risks, or acceptance criteria changed.
3. Add or update focused tests for pure state and feature boundaries.
4. Run `npm run check` after TypeScript/React/module changes.
