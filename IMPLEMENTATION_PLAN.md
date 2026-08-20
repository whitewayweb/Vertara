# Vertara — Next.js Implementation Plan

> **Living plan:** Update this document in the same change as any approved feature or direction change. Keep product scope, architecture, risks, acceptance criteria, and the phase/MVP checklists aligned with the implemented state. Mark work complete only after its listed verification has passed; capture intentional deferrals and known limitations here.

> **Feature reference:** [`docs/features/README.md`](docs/features/README.md) is the concise implementation catalogue for AI tools and contributors. Update it with any implemented feature or changed ownership boundary; keep feature-specific detail in `docs/features/`.

> **Architecture reference:** [`docs/architecture.md`](docs/architecture.md) documents the current technical architecture. Keep it in sync when runtime boundaries, module ownership, media flow, or privacy-relevant implementation changes.

## Product definition

**Vertara** is a privacy-first, browser-based video reframing editor. It converts creator-owned landscape footage into vertical and square social-ready exports without uploading video files to a server.

Initial supported output presets:

- Portrait: 1080 × 1920 (9:16)
- LinkedIn feed: 1080 × 1350 (4:5)
- Major social-destination presets: Instagram Reels/Stories/Feed/Square/Landscape, YouTube Shorts/Landscape, TikTok vertical/Square, Facebook Reels/Stories/Feed, Snapchat Spotlight, Pinterest Pin/Square, X square/Landscape/Wide, and LinkedIn Feed/Square/Landscape.
- Square: 1080 × 1080 (1:1)
- Performance option: 720p portrait and square

The primary creator journey is: select a landscape video from the local device, reframe it as a portrait video without an account, then sign in to download the resulting MP4. Vertara does not publish to, authenticate with, or upload video to YouTube. Authentication identifies the account entitled to download; source media remains on the local device and is never uploaded as part of sign-in or export.

The product should describe exports as “social-ready” and may state in plain text that vertical outputs are suitable for platforms such as YouTube Shorts. Do not include third-party platform names, logos, or lookalike branding in Vertara’s product name or visual identity.

## Scope

### MVP

1. Local, browser-only import for MP4 and WebM, with MOV accepted only when its codec is browser-readable.
2. Media inspection: duration, intrinsic size, aspect ratio, video/audio track presence, and an unsupported-file message.
3. Editable trim start/end points.
4. Three layouts:
   - **Focus**: 9:16 cover crop with horizontal pan and zoom.
   - **Canvas**: sharp landscape video over a blurred, dimmed 9:16 backdrop. This is the default layout so landscape footage remains fully visible.
   - **Poster**: colour/gradient canvas with video and optional headline/subline text.
5. A responsive, lower-resolution live preview.
6. Client-side MP4 export with progress, cancellation, download, and recoverable failure states.
7. Local persistence of the current edit settings for the selected session.
8. A factual export-readiness panel: resolution, aspect ratio, duration, and codec/container information where available.
9. Anonymous editing up to the download step; require sign-in only when the user requests the completed export download.

### Explicitly defer

- Automatic face/subject tracking.
- Multi-clip timeline editing, transitions, captions generated from speech, and templates marketplace.
- Loudness normalization; offer mute and gain only in MVP.
- Cloud storage, server-side processing, collaboration, billing, and direct publishing integrations. Authentication is limited to the download entitlement flow; it must not make source-media upload or server-side processing a prerequisite.
- Guaranteed conversion of encrypted, DRM-protected, corrupt, or unsupported-codec media.

## Architecture direction

Use Next.js App Router, TypeScript, React, and static hosting. The application must run its editor only in the browser; server components should be limited to the landing/editor shell.

The implemented architecture is documented in [`docs/architecture.md`](docs/architecture.md). This section records the approved target direction and remaining architecture work; it is not a replacement for the current-state architecture guide.

### Processing layers

| Layer | Responsibility | Recommended technology |
| --- | --- | --- |
| Editor UI | State, controls, accessibility, route shell | React + TypeScript, Tailwind CSS v4, shadcn/ui |
| Media inspection | Probe a selected local `File`; surface browser capability | HTMLMediaElement + MediaCapabilities where useful |
| Preview renderer | Draw the layout efficiently at an adaptive preview resolution | `requestVideoFrameCallback` where supported, Canvas 2D fallback |
| Export orchestrator | Compose frames/audio, report progress, cancellation | Dedicated Web Worker |
| Encoder backend | Encode a downloadable MP4 | WebCodecs when supported; FFmpeg WASM compatibility backend |
| Persistence | Save non-video edit settings | IndexedDB (and a small preference store) |

Keep the preview renderer and export renderer separate. The preview may use a smaller adaptive canvas, whereas export uses the requested output dimensions. This prevents a promise of real-time 1080p/4K editing on every device.

### Capability model

Run a capability check before accepting a file and again before export:

- Cross-origin isolation and `SharedArrayBuffer` availability.
- WebCodecs encode/decode availability and supported H.264/AAC configurations.
- Hardware concurrency, available memory signals where supported, and output-size estimate.
- File/container codec viability.

If WebCodecs cannot produce the target export, offer the FFmpeg WASM path. If neither path is viable, show a clear explanation and offer a lower-resolution export where possible. Do not silently begin an export that is likely to exhaust the device.

### Browser-only input strategy

Test every selected MP4, WebM, or MOV with the browser decoder and open it directly only when metadata can load. No source video is converted or uploaded. A metadata timeout reports unreadable codecs promptly instead of leaving the import interface in an indefinite loading state. H.264/AVC video with AAC audio in an MP4 container is the recommended, most broadly compatible input.

### Security and privacy

- Keep source footage in browser memory or IndexedDB only; do not submit it to application servers or analytics services.
- Use a restrictive Content Security Policy and no third-party advertising scripts in the editor.
- Configure COOP/COEP only after verifying every loaded asset can satisfy the required cross-origin resource policy. Self-host editor fonts and WASM assets.
- Announce the privacy property plainly: “Your videos stay on this device.”

## Target code structure

```text
src/
  app/
    page.tsx                         # Landing/entry route
    editor/page.tsx                  # Client editor boundary
    layout.tsx
  components/
    editor/
      ImportPanel.tsx
      MediaSummary.tsx
      PreviewStage.tsx
      TimelineTrimControl.tsx
      LayoutControls.tsx
      TextOverlayControls.tsx
      ExportPanel.tsx
      CapabilityNotice.tsx
    ui/                              # shadcn/ui primitives; generated and locally owned
    atoms/                           # Vertara-specific single-purpose controls
    molecules/                       # Small compositions of atoms
    organisms/                       # Feature-level editor panels and sections
  features/
    project/
      project.types.ts
      project.store.ts
      project.validation.ts
    media/
      inspect-media.ts
      media-capabilities.ts
    render/
      layout-math.ts
      preview-renderer.ts
      export-render-plan.ts
    export/
      export.service.ts
      webcodecs-exporter.ts
      ffmpeg-exporter.ts
      export.worker.ts
    persistence/
      project-repository.ts
  lib/
    format.ts
    browser.ts
public/
  wasm/
```

Keep feature modules independent. UI components may depend on feature-facing interfaces, but must not call FFmpeg or browser media APIs directly. The export service selects an encoder via an interface so either backend can be replaced or mocked. Follow Atomic Design: shadcn/ui provides primitives, while Vertara-specific UI is layered as atoms, molecules, organisms, and route templates.

## Target domain model

```ts
type OutputPreset = "portrait-1080" | "portrait-720" | "square-1080" | "square-720";
type LayoutMode = "focus" | "canvas" | "poster";

interface EditProject {
  version: 1;
  source: MediaDescriptor;
  trim: { startSeconds: number; endSeconds: number };
  output: { preset: OutputPreset; fps: 30 | 60 };
  layout: FocusLayout | CanvasLayout | PosterLayout;
  audio: { muted: boolean; gain: number };
}
```

Validate all edit values at the boundary: trim values within duration, `start < end`, bounded pan/zoom/blur/text size, and no unbounded output duration. Default to 30 fps; unlock 60 fps only when the source and selected encoder support it.

## Phased delivery

### Phase 0 — Foundation

- [x] Create a Next.js App Router project with TypeScript, strict type checking, ESLint, Knip, a Vitest unit-test runner, and Playwright configuration.
- [x] Establish Tailwind CSS v4 and shadcn/ui as the UI foundation. Use `components.json` as the shadcn/ui configuration source and add components through its CLI.
- [x] Add brand basics: a purpose-led Vertara landing page, Vertara document title, clear privacy copy, and an editor entry point.
- Add static-host deployment configuration and headers behind a tested feature toggle.

**Exit criteria:** production build and deployment succeed; editor route loads with no browser-only APIs executing during server render.

**Current status:** the production build and the `/editor` route are verified locally. Deployment configuration remains to be selected and verified.

### Phase 1 — Import and inspection

- [x] Build accessible drag/drop and file-picker import.
- [x] Create object URLs, inspect metadata after `loadedmetadata`, and clean up URLs after inspection.
- [x] Display supported-file validation results and media metadata.
- [x] Display device capability warnings before import when browser export APIs are unavailable or device concurrency is low.
- Persist edit settings only—not full source files—until an explicit offline-file feature is designed.

**Exit criteria:** representative MP4/WebM files report metadata correctly; unsupported files fail clearly.

**Current status:** unsupported-file validation has unit coverage and the browser metadata path is implemented. Representative local media fixtures and device-capability warnings remain before the phase exit criteria are complete.

### Phase 2 — Editing and preview

- Implement the remaining pure layout math for Canvas/Poster modes, blurred backdrops, and safe text placement.
- [x] Implement pure Focus-layout state for a 9:16 cover preview with bounded horizontal pan and zoom.
- [x] Implement the default Canvas preview with a sharp, contained landscape video over a blurred, dimmed copy of the same local source.
- [x] Present live Canvas, Focus, and Poster layout previews before the user selects one and continues to its editing view.
- [x] Implement a Poster preview with an editable headline and subline over a gradient canvas.
- [x] Add shared trim start/end and mute settings which immediately control every live layout preview.
- [x] Add 1×–5× playback-speed controls in 0.5× increments. Preview and export use the same speed setting; fast exports preserve Vertara's fixed-rate rendered frames by raising output frame rate and bitrate proportionally, producing a shorter MP4 without reducing per-frame encoding budget. See `docs/features/video-speed.md` for the user contract and source-frame limitation.
- [x] Add user-authored text overlays with editable text, foreground/background colours, typeface, draggable in-video position, edge-resizable text block, and timing; render every non-blank layer in both preview and MP4 export. Controls live directly above the preview.
- [x] Add fade, pop, and slide-up entrance styles for timed text layers, with matching preview and MP4-export timing.
- [x] Add a local emoji-sticker quick picker; stickers remain standard editable text layers so their timing, positioning, animation, and export behaviour stay consistent.
- [x] Add bounded text-layer undo/redo with keyboard shortcuts, without conflating playback/export events with edit history.
- [x] Add toggleable output-format-aware social safe-area guides to keep text clear of common interface chrome; guides are independent of Canvas/Focus/Poster and excluded from exports.
- [x] Add reusable Text, Hook, Quote, and CTA text templates through an Add text menu in the Edit preview header; selected layers show type-relevant controls in the existing contextual right inspector and an aligned text timing lane, alongside duplicate/delete actions.
- [x] Add left, centre, and right text alignment with matching preview and MP4 export rendering.
- [x] Add Canvas backdrop blur, intensity, and dim controls for professional full-frame framing adjustments.
- [x] Add shared brightness, contrast, saturation, and warmth controls to all layout previews and MP4 export.
- [x] Replace the non-functional left rail and duplicate text-only layout controls with visual, selectable layout treatments that are themselves the real Canvas, Focus, and Poster previews; selecting a treatment changes the existing mode without a duplicate preview surface.
- Build playback-synchronised Canvas preview with adaptive canvas resolution.
- Add per-layout blur/dim and colour controls, audio gain, and undo/redo for editing settings.

**Current status:** the browser editor lets creators compare visual treatments using their own locally selected footage, choose Canvas, Focus, or Poster by seeing the result, and edit the selected treatment alongside shared trim, speed, mute, and colour-adjustment controls. The framing treatment controls are the single source of truth for the existing layout state; the inspector contains only the selected treatment’s adjustments. Creators add text layers or local emoji stickers from the Add text menu in the Edit preview header. Each new layer is selected directly on the preview, while the existing right inspector shows only controls fitting its semantic type; direct text, colour, optional transparent fill, social-friendly type styles, fade/pop/slide-up entrance motion, size, timing, in-video positioning, and edge-resizable width remain shared by Canvas, Focus, Poster previews, and MP4 export. The dedicated text timing lane keeps the layer name separate from its scaled duration, so short layers remain readable in long videos without displacing the preview. Brightness, contrast, saturation, and warmth are applied to every layout in preview and export. Preview playback loops within the selected trim range. Rendering remains DOM-video based while the adaptive canvas renderer and export pipeline are still deferred.

**Default project settings:** Canvas is the starting layout, with a 25px fully opaque blurred backdrop at 80% dim. Source audio is unmuted, and YouTube Shorts (1080 × 1920, 9:16) is the selected export destination.

**Approved editor visual direction (2026-08-18):** The editor uses a professional graphite desktop workspace with a compact tool rail, central output frame, timeline, and right-hand inspector. Cyan is reserved for active states and privacy status; violet is reserved for temporal/audio detail. The approved visual reference is versioned at `public/design-references/vertara-editor-dark-workspace-concept.png` with design notes in `docs/design/vertara-editor-dark-workspace.md`. The redesigned interface preserves browser-only handling of source media and keeps responsive fallback behaviour for smaller screens.

**Workspace interaction refinement (2026-08-18):** On desktop, the editor is a fixed-height application shell: the tool rail, central preview/timeline region, and inspector scroll independently, preventing page-level scrolling during editing. The inspector is a single-open accordion. Preview controls now play/pause and mute/unmute the live local video, and the timeline is clickable to seek inside the current trim.

**Component reconciliation (2026-08-18):** The editor uses shadcn/ui primitives for shared controls (accordion, button, checkbox, input, select, and slider). Vertara-specific range controls are atoms; the timeline and layout-aware preview stage are molecules; `LayoutEditor` remains the editor organism responsible only for project state and export orchestration. This keeps the reusable control layer separate from browser-facing preview and export feature interfaces.

**Playback permission handling (2026-08-18):** Live previews start paused. Programmatic play requests are handled as browser-permission-sensitive operations; a browser rejection leaves the preview paused without surfacing an unhandled runtime error. The creator explicitly starts playback with the preview control.

**Known input limitation:** Vertara tests each accepted file with the browser decoder, rather than trusting its extension or MIME type. A file that the browser can decode opens immediately and no conversion runs. MP4 and WebM are the cross-browser options; compatible MOV files may work in Safari. If metadata does not load within 10 seconds, the editor reports that the codec is unsupported and recommends Safari for MOV or H.264/AAC MP4 / compatible WebM. No source media leaves the browser.

**Exit criteria:** preview changes within a frame or two during normal edits; preview matches reference layout-math snapshots.

### Phase 3 — Export

- [x] Implement an initial browser-only WebCodecs/H.264 MP4 renderer with Canvas, Focus, and Poster layout reconciliation, progress, and download at 720p or 1080p.
- Add audio handling and muxing to MP4; prove playback in current Chrome, Safari, and Firefox support boundaries.
- Add FFmpeg WASM worker fallback for compatible inputs.
- [x] Implement cancellation for active browser exports, download, and memory cleanup. Progress still reports rendering as a single phase; preparing, encoding, and packaging sub-phases remain deferred.

**Exit criteria:** exports produce playable MP4s at both output sizes; trim and all layouts match preview within documented tolerances.

**Current status:** the initial MP4 renderer emits timestamped 30fps source samples so the MP4 muxer can package browser encoder output reliably. At speeds above 1×, it retains that rendered sequence while encoding at a proportionally higher output frame rate and bitrate; `VideoEncoder.isConfigSupported()` rejects unsupported size/speed combinations before an export begins. It has no audio track yet; its UI makes this explicit. Audio muxing, cancellation, and browser support verification remain required before the Phase 3 exit criteria can be met.

### Phase 4 — Quality and launch readiness

- Add browser/device support matrix and test fixtures (short 1080p MP4, WebM, audio-less input, long input requiring trim, portrait input, unsupported codec).
- Verify cross-origin isolation in production, not only locally.
- Add error telemetry that excludes file names, video pixels, and media metadata unless the user explicitly consents.
- Add an authentication boundary at download: users can import, edit, preview, and prepare an export anonymously; sign-in is required only to obtain the finished download. Verify that authentication never transfers source video or identifying media metadata.
- Write a privacy page, limitations page, and accessible keyboard control pass.

**Exit criteria:** documented device limits, reliability test results, zero unhandled export errors in test runs, and an agreed beta-support matrix.

## Testing strategy

- **Unit:** layout math, trim validation, output dimensions, readiness rules, export-backend selection.
- **Component:** import states, validation messaging, control-to-project bindings, keyboard accessibility.
- **Integration:** seeded video fixtures through inspection and renderer-plan generation.
- **End-to-end:** import → edit → export → verify output dimensions/duration with a media probe in CI where the environment supports it.
- **Manual:** current Chrome, Safari, and Firefox; Windows/macOS; a lower-spec device; at least one cross-origin-isolated production deployment.

## Delivery risks and decisions to resolve early

1. **Browser codec support:** define an honest supported-input matrix and test it before advertising MOV support.
2. **Memory pressure:** set tested input recommendations; provide 720p export and never claim unlimited file sizes.
3. **Input-codec support:** communicate the supported browser-input matrix clearly and recommend H.264/AAC MP4 for reliable import.
4. **Audio muxing:** validate output compatibility early; it is a key technical risk for a browser-only MP4 exporter.

## MVP acceptance checklist

- [ ] A user can import a supported local MP4/WebM without uploading it.
- [ ] A user can create portrait and square output in each MVP layout.
- [ ] A user can trim, pan, zoom, add layout text and an optional opening hook, mute, and adjust gain.
- [ ] Output download is a playable MP4 at the selected dimensions and trimmed duration.
- [ ] A user can complete all editing anonymously and is asked to sign in only after requesting download; sign-in does not upload source footage or identifying media metadata.
- [ ] Progress, cancellation, unsupported-format, and out-of-memory guidance are clear and recoverable.
- [ ] The app is deployable as a static Next.js experience with a verified privacy statement.
