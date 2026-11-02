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
            ├─ EditorGuide + tool panels → plain-language steps and their controls
            ├─ preview components → HTMLVideoElement playback (+ Web Audio cleanup, segmented canvas)
            ├─ prepareExportAudio → decoded source, cuts, speed, cleanup, music → PCM
            ├─ transcribeOnDevice → Web Worker + Whisper (Transformers.js) → word timestamps
            ├─ scanFaceTrack / background compositor → MediaPipe in the page
            └─ exportLocalMp4 → drawExportFrame + WebCodecs + MP4 muxer → local download
```

The selected file is represented by an object URL, not uploaded. `ImportPanel` revokes the URL when replacing a file or unmounting.

Captions, face tracking, and background removal download model files once from public hosts (Hugging Face, jsDelivr, Google Cloud Storage) when someone first uses them. Those are one-way downloads: no video, audio, or transcript is ever sent. Each panel states the download size before it starts.

## Module ownership

| Layer | Owns | Key locations |
| --- | --- | --- |
| Routes | Route shell and entry points | `src/app/` |
| Organisms | Editor state orchestration and import-to-editor transition | `components/organisms/import-panel.tsx`, `components/organisms/layout-editor.tsx` |
| Molecules | Step guide, one panel per step (frame, cleanup, captions, brand, export), preview-stage composition, caption and text overlays, timeline, drag/drop UI | `components/molecules/` |
| Atoms | Single-purpose controls: browser video, music preview, range, tool section, file button | `components/atoms/` |
| Project features | Validated edit-state contracts: playback and time mapping, clip cuts, edit history, text overlays, output preset registry | `features/project/` |
| Render features | `ProjectRenderState`, bounded Canvas/Focus/Poster layouts, focus track | `features/render/` |
| Audio features | Silence and beat detection, pure signal processing, export soundtrack, preview cleanup graph | `features/audio/` |
| Caption features | Line grouping, active word, fillers, subtitle files, on-device transcription worker | `features/captions/` |
| Vision features | MediaPipe loading, face tracking, background compositing | `features/vision/` |
| Brand features | Stored brand kit, saved text looks, logo placement | `features/brand/` |
| Media features | Local file validation, metadata inspection, off-screen video lifecycle | `features/media/` |
| Export features | Capability assessment, frame drawing, local H.264/AAC MP4 encoding | `features/export/` |

## State and data flow

`LayoutEditor` owns the current edit state for one selected local file:

- `PlaybackSettings`: trim start/end, mute, speed, and merged `removedRanges`. Always construct updates with `createPlaybackSettings()`. Convert between source and finished-video time only through its helpers (`getOutputElapsedSeconds`, `getSourceSeconds`, `getKeptRanges`).
- `ProjectEdits`: `TextOverlay[]` plus `ClipCut[]`, held in one undo history. Each cut records the tool that made it (`silence`, `filler`, `word`, `beat`), so each tool can replace or restore only its own.
- `AudioSettings`, `CaptionSettings` with the transcript, `BackgroundSettings`, and `BrandKit`. The brand kit persists in `localStorage`; everything else lasts for the session.
- `CanvasLayout`, `FocusLayout`, `PosterLayout`, and `VideoAdjustments`: layout-specific state. Use their feature constructors where provided to maintain bounds.
- `TextOverlay[]`: user-authored text layers, each with a semantic kind (`text`, `hook`, `quote`, `cta`, or `sticker`), bounded styling, entrance timing, in-frame drag coordinates, and text-block width. Use `createTextOverlay()` to maintain valid values.
- `OutputSettings`: selected from the `outputPresets` registry; dimensions must not be copied into UI code.

Visual state is combined into one `ProjectRenderState`, passed to `EditorPreviewStage` and to `exportLocalMp4`. This is the preview/export parity boundary. New editable state must have a clear owner and be deliberately threaded through both paths when it affects output.

## Rendering paths

### Preview

`PlaybackVideo` uses a local HTML video element for playback, seeking, trim looping, skipping cuts, mute, and speed, and can draw through the background compositor. `EditorPreviewStage` selects Canvas, Focus, or Poster composition and layers captions, text, logo, and guides on top. Preview is responsive and browser-decoder dependent. The noise gate and loudness levelling run only at export; the preview plays the rumble filter and compressor.

### Export

`exportLocalMp4` loads the local object URL into an off-DOM video element, seeks it frame-by-frame through the kept ranges, calls `drawExportFrame` for layout, colour, captions, text, and logo, encodes H.264 with WebCodecs, and muxes an MP4 in memory. It reports progress, accepts cancellation, and returns a `Blob` for browser download. Release off-DOM video elements with `releaseVideoElement`; removing them alone keeps a decoder busy and can stall the preview.

`prepareExportAudio` builds the finished soundtrack once per export batch: it joins kept sections, stretches them to the playback speed without raising pitch, applies cleanup, and mixes music. The exporter encodes AAC, or Opus where AAC is unavailable. Device and configuration support are validated locally; unsupported exports must show a clear recoverable error.

## Documentation map for AI tools

1. Read [`../AGENTS.md`](../AGENTS.md) for mandatory engineering and privacy rules.
2. Read [`features/README.md`](features/README.md) for the implemented-feature catalogue and extension rules.
3. Read the relevant feature spec in `docs/features/` for complex behaviour, such as [`features/video-speed.md`](features/video-speed.md).
4. Read [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) before changing scope, architecture, privacy, support commitments, or a delivery milestone.

## Intentional gaps

- No server-side media handling, cloud storage, collaboration, direct publishing, or telemetry of source media.
- No FFmpeg WASM fallback, frame-accurate decoding of arbitrary variable-frame-rate media, persistence of source files or project state, or multi-clip timelines.
- No account or sign-in: Vertara is free, and exports do not require authentication.

Update this document when the actual module boundaries, data flow, or runtime architecture changes. Do not use it as a feature backlog; that belongs in the implementation plan.
