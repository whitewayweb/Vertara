const decodeSampleRate = 48_000;
let cached: { promise: Promise<AudioBuffer | undefined>; url: string } | undefined;

async function decodeAudioFile(url: string): Promise<AudioBuffer> {
  const bytes = await (await fetch(url)).arrayBuffer();
  return new OfflineAudioContext(2, 1, decodeSampleRate).decodeAudioData(bytes);
}

/** Decodes the imported video's sound on this device. Resolves undefined when it has no usable sound. */
export function loadSourceAudio(sourceUrl: string): Promise<AudioBuffer | undefined> {
  if (cached?.url !== sourceUrl) cached = { promise: decodeAudioFile(sourceUrl).catch(() => undefined), url: sourceUrl };
  return cached.promise;
}

export function loadMusicAudio(musicUrl: string): Promise<AudioBuffer> {
  return decodeAudioFile(musicUrl);
}

export function getMonoSamples(buffer: AudioBuffer): Float32Array {
  const mono = new Float32Array(buffer.length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < samples.length; index += 1) mono[index] += samples[index] / buffer.numberOfChannels;
  }
  return mono;
}

export async function resampleToMono(buffer: AudioBuffer, sampleRate: number): Promise<Float32Array> {
  const context = new OfflineAudioContext(1, Math.ceil(buffer.duration * sampleRate), sampleRate);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  return (await context.startRendering()).getChannelData(0);
}
