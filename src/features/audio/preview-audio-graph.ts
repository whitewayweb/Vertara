import { connectVoiceFilters } from "@/features/audio/export-audio";

interface PreviewGraph {
  dry: GainNode;
  wet: GainNode;
}

const graphs = new WeakMap<HTMLVideoElement, PreviewGraph>();
// Browsers limit how many contexts a page may open, and previews are recreated as people move between steps.
let sharedContext: AudioContext | undefined;

/** Lets people hear sound cleanup while previewing. A media element can only be attached once. */
export function setPreviewCleanup(video: HTMLVideoElement, enabled: boolean): void {
  let graph = graphs.get(video);
  if (!graph && !enabled) return;
  sharedContext ??= new AudioContext();
  const context = sharedContext;
  if (!graph) {
    const source = context.createMediaElementSource(video);
    const dry = context.createGain();
    const wet = context.createGain();
    source.connect(dry);
    dry.connect(context.destination);
    connectVoiceFilters(context, source).connect(wet);
    wet.connect(context.destination);
    graph = { dry, wet };
    graphs.set(video, graph);
  }
  void context.resume();
  graph.dry.gain.value = enabled ? 0 : 1;
  graph.wet.gain.value = enabled ? 1.6 : 0;
}
