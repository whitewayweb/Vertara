# Vertara editor dark workspace

Approved visual direction for the browser editor. The reference image is stored at [`public/design-references/vertara-editor-dark-workspace-concept.png`](../../public/design-references/vertara-editor-dark-workspace-concept.png).

## Product principles

- Keep the frame and timeline as the primary work surface; controls should support the work, not compete with it.
- Use a graphite workspace with restrained cyan selection states and minimal violet only for audio or temporal information.
- Preserve the browser-only media and export architecture. This visual direction must not introduce uploads, telemetry, third-party processing, or platform integrations.
- Keep desktop information-dense but responsive: the footage context condenses on narrow screens, and the inspector moves beneath the preview when required.
- Make framing choices understandable by showing the creator’s own footage in each treatment. Do not add a separate guide, score, checklist, or wizard.

## Interaction model

- Top bar: project context, undo/redo affordances, and export.
- Left context: local footage name, dimensions, duration, and privacy status.
- Centre: a compact Frame/Text switch. Frame presents three visual treatments—Show the scene, Fill the frame, and Lead with a message—using the current local footage; Text exposes text-layer controls. The selected treatment drives the output preview and playback controls above a single-source timeline.
- Right inspector: adjustments for the selected treatment, trim/audio, and export preset.

The interface should guide through direct visual comparison and context-sensitive controls rather than explanatory UI. This reference guides hierarchy, spacing, tone, and control placement. It is not a requirement to reproduce external editor products or their visual identity.
