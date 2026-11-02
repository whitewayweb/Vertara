export interface MusicTrack {
  duck: boolean;
  name: string;
  url: string;
  volume: number;
}

export interface AudioSettings {
  cleanup: boolean;
  music?: MusicTrack;
}

export const defaultAudioSettings: AudioSettings = { cleanup: false };
