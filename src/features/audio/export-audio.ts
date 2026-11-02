import { applyNoiseGate, extractKeptSamples, mixMusic, normalizeLoudness, timeStretch } from "@/features/audio/audio-processing";
import type { AudioSettings } from "@/features/audio/audio-settings";
import { loadMusicAudio, loadSourceAudio } from "@/features/audio/source-audio";
import { getExportDurationSeconds, getKeptRanges, type PlaybackSettings } from "@/features/project/playback-settings";

export interface ExportAudio {
  channels: Float32Array[];
  sampleRate: number;
}

const sampleRate = 48_000;

/** Builds the finished soundtrack once, so a batch of formats can share it. */
export async function prepareExportAudio(audio: AudioSettings, playback: PlaybackSettings, sourceUrl: string): Promise<ExportAudio | undefined> {
  const source = playback.muted ? undefined : await loadSourceAudio(sourceUrl);
  const outputLength = Math.ceil(getExportDurationSeconds(playback) * sampleRate);
  let channels: Float32Array[] = [];

  if (source) {
    const ranges = getKeptRanges(playback);
    channels = Array.from({ length: Math.min(2, source.numberOfChannels) }, (_, channel) => timeStretch(extractKeptSamples(source.getChannelData(channel), source.sampleRate, ranges), playback.speed, source.sampleRate));
    if (audio.cleanup) {
      channels = await filterVoice(channels.map((samples) => applyNoiseGate(samples, sampleRate)));
      normalizeLoudness(channels, sampleRate);
    }
  }

  if (audio.music) {
    const music = await loadMusicAudio(audio.music.url);
    const musicChannels = channels.length > 0 ? channels.length : Math.min(2, music.numberOfChannels);
    const { duck, volume } = audio.music;
    channels = Array.from({ length: musicChannels }, (_, channel) => mixMusic(channels[channel], music.getChannelData(Math.min(channel, music.numberOfChannels - 1)), sampleRate, volume, duck, outputLength));
  }

  return channels.length > 0 ? { channels, sampleRate } : undefined;
}

async function filterVoice(channels: Float32Array[]): Promise<Float32Array[]> {
  const context = new OfflineAudioContext(channels.length, channels[0].length, sampleRate);
  const buffer = context.createBuffer(channels.length, channels[0].length, sampleRate);
  channels.forEach((samples, channel) => buffer.copyToChannel(new Float32Array(samples), channel));
  const source = context.createBufferSource();
  source.buffer = buffer;
  connectVoiceFilters(context, source).connect(context.destination);
  source.start();
  const rendered = await context.startRendering();
  return channels.map((_, channel) => rendered.getChannelData(channel));
}

/** Removes low rumble and evens out peaks. Shared by the preview and the export. */
export function connectVoiceFilters(context: BaseAudioContext, input: AudioNode): AudioNode {
  const rumbleFilter = context.createBiquadFilter();
  rumbleFilter.type = "highpass";
  rumbleFilter.frequency.value = 80;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.ratio.value = 3;
  input.connect(rumbleFilter);
  rumbleFilter.connect(compressor);
  return compressor;
}
