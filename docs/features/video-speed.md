# Video speed

## Purpose

Let a creator shorten a selected video range while retaining the complete frame sequence produced by Vertara's normal 30fps renderer. The speed setting applies to both the live preview and exported MP4.

## User contract

- The Speed control is in **Trim & audio**.
- Supported values are 1×, 1.5×, 2×, 2.5×, 3×, 3.5×, 4×, 4.5×, and 5×. The default is 1×.
- Export duration is `(trim end − trim start) ÷ speed`.
- Preview plays at the selected speed and loops inside the selected trim.
- A faster export retains the same frames that a 1× Vertara export would render. It raises the encoded frame rate and bitrate by the selected speed, so it does not deliberately discard rendered frames or reduce their encoding budget.
- Opening-hook duration is measured in output time. A hook configured for two seconds remains visible for two seconds in the fast export.

## Technical source of truth

| Concern | Owner |
| --- | --- |
| Allowed values, validation, and duration math | `src/features/project/playback-settings.ts` |
| Browser preview rate | `src/components/atoms/playback-video.tsx` |
| Speed selector and estimated export duration | `src/components/organisms/layout-editor.tsx` |
| Output frame timestamps, bitrate, and H.264 encoder configuration | `src/features/export/local-mp4-exporter.ts` |

`PlaybackSettings.speed` is the only speed state. Preview UI and export code must use it rather than keeping another rate value.

## Export algorithm

The renderer samples the trim at 30 source-time frames per second, as it does at 1×. At speed `s`, it encodes those same samples at `30 × s` fps and timestamps them at that output rate. Bitrate is also `7 Mbps × s`. This makes the MP4 approximately `1 ÷ s` as long.

Before export, `VideoEncoder.isConfigSupported()` validates the selected resolution and speed. If the device cannot encode the requested combination, Vertara keeps the edit local and asks the creator to choose a lower speed or resolution.

## Current limitation

This is a fixed-rate canvas renderer, not a frame-accurate WebCodecs decoder. “All frames” means every frame in Vertara's 30fps rendered sequence is retained; it does not promise preservation of every encoded frame from an arbitrary high-frame-rate or variable-frame-rate source. Frame-accurate source preservation requires the future decoder/export pipeline to enumerate source frames directly.

## Verification

- Unit-test allowed speeds, fallback validation, and output-duration math in `playback-settings.test.ts`.
- Manually compare a 1× and a fast export: the latter should be shorter and visually contain the same rendered sequence at a higher reported frame rate.
- Run `npm run check` after changing this feature.
