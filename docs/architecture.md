# Vertara architecture

This document describes the implemented architecture. It is the technical reference for contributors and AI tools. For approved future work, delivery status, and acceptance criteria, read [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) instead.

## Architectural constraints

- Vertara is browser-first and privacy-first: source media remains on the device. Do not add server uploads, remote media processing, or media analytics without explicit approval.
- Browser APIs belong only in client components or browser-facing feature modules. Server-rendered routes must not access `window`, `document`, `HTMLVideoElement`, WebCodecs, or IndexedDB.
- Preview and export are separate render paths. A preview change is not an exported feature until the exporter implements it too.
- `src/components/ui` contains shadcn-managed primitives. Product-specific behaviour belongs in Vertara atoms, molecules, organisms, or feature modules.

## Runtime boundaries

```text
Next.js route shell
  └─ ImportPanel (client)
       ├─ inspectMediaFile → local File metadata and object URL
       └─ LayoutEditor (client)
            ├─ preview components → HTMLVideoElement playback
            └─ exportLocalMp4 → Canvas + WebCodecs + MP4 muxer → local download
```

The selected file is represented by an object URL, not uploaded. `ImportPanel` revokes the URL when replacing a file or unmounting.

## Module ownership

| Layer | Owns | Key locations |
| --- | --- | --- |
| Routes | Route shell and entry points | `src/app/` |
| Organisms | Editor state orchestration and import-to-editor transition | `components/organisms/import-panel.tsx`, `components/organisms/layout-editor.tsx` |
| Molecules | Preview-stage composition, visual layout-choice cards, layout preview variants, timeline, drag/drop UI | `components/molecules/` |
| Atoms | Single-purpose browser-video and range controls | `components/atoms/` |
| Project features | Validated edit-state contracts: playback, text overlays, and output preset registry | `features/project/` |
| Render features | Bounded Canvas/Focus/Poster layout configuration | `features/render/` |
| Media features | Local file validation and metadata inspection | `features/media/` |
| Export features | Capability assessment and local H.264 MP4 encoding | `features/export/` |

## State and data flow

`LayoutEditor` owns the current edit state for one selected local file:

- `PlaybackSettings`: trim start/end, mute, and speed. Always construct updates with `createPlaybackSettings()`.
- `CanvasLayout`, `FocusLayout`, `PosterLayout`, and `VideoAdjustments`: layout-specific state. Use their feature constructors where provided to maintain bounds.
- `TextOverlay[]`: user-authored text layers, each with bounded styling, entrance timing, in-frame drag coordinates, and text-block width. Use `createTextOverlay()` to maintain valid values.
- `OutputSettings`: selected from the `outputPresets` registry; dimensions must not be copied into UI code.

The same state is passed to preview components and to `exportLocalMp4`. This is the preview/export parity boundary. New editable state must have a clear owner and be deliberately threaded through both paths when it affects output.

## Rendering paths

### Preview

`PlaybackVideo` uses a local HTML video element for playback, seeking, trim looping, mute, and speed. `EditorPreviewStage` selects Canvas, Focus, or Poster composition. Preview is responsive and browser-decoder dependent.

### Export

`exportLocalMp4` loads the local object URL into an off-DOM video element, seeks it frame-by-frame, draws a Canvas frame for the chosen layout, video colour adjustments, and text overlays, encodes H.264 with WebCodecs, and muxes an MP4 in memory. It reports progress, accepts cancellation, and returns a `Blob` for browser download.

Current export is video-only: source audio is not muxed. Device and configuration support are validated locally; unsupported exports must show a clear recoverable error.

## Documentation map for AI tools

1. Read [`../AGENTS.md`](../AGENTS.md) for mandatory engineering and privacy rules.
2. Read [`features/README.md`](features/README.md) for the implemented-feature catalogue and extension rules.
3. Read the relevant feature spec in `docs/features/` for complex behaviour, such as [`features/video-speed.md`](features/video-speed.md).
4. Read [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) before changing scope, architecture, privacy, support commitments, or a delivery milestone.

## Intentional gaps

- No server-side media handling, cloud storage, collaboration, direct publishing, or telemetry of source media.
- No audio muxing, FFmpeg WASM fallback, frame-accurate decoding of arbitrary variable-frame-rate media, persistence of source files, multi-clip timelines, automatic captions, or brand-kit workflow.

Update this document when the actual module boundaries, data flow, or runtime architecture changes. Do not use it as a feature backlog; that belongs in the implementation plan.
