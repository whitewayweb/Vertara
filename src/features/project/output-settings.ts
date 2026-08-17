export type OutputPreset = string;

export interface OutputSettings {
  description: string;
  destination: string;
  height: number;
  label: string;
  preset: OutputPreset;
  width: number;
}

export const outputPresets: Record<OutputPreset, OutputSettings> = {
  "instagram-reels": {
    preset: "instagram-reels", destination: "Instagram Reels", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "instagram-story": {
    preset: "instagram-story", destination: "Instagram Story", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "youtube-shorts": {
    preset: "youtube-shorts", destination: "YouTube Shorts", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "youtube-video": {
    preset: "youtube-video", destination: "YouTube video", description: "Standard landscape video", label: "1920 × 1080 · 16:9", width: 1920, height: 1080,
  },
  tiktok: {
    preset: "tiktok", destination: "TikTok", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "tiktok-square": {
    preset: "tiktok-square", destination: "TikTok square", description: "Square in-feed video", label: "1080 × 1080 · 1:1", width: 1080, height: 1080,
  },
  "facebook-reels": {
    preset: "facebook-reels", destination: "Facebook Reels", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "facebook-story": {
    preset: "facebook-story", destination: "Facebook Story", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "snapchat-spotlight": {
    preset: "snapchat-spotlight", destination: "Snapchat Spotlight", description: "Full-screen vertical", label: "1080 × 1920 · 9:16", width: 1080, height: 1920,
  },
  "instagram-feed": {
    preset: "instagram-feed", destination: "Instagram Feed", description: "Feed-optimised portrait", label: "1080 × 1350 · 4:5", width: 1080, height: 1350,
  },
  "instagram-square": {
    preset: "instagram-square", destination: "Instagram square", description: "Square feed post", label: "1080 × 1080 · 1:1", width: 1080, height: 1080,
  },
  "instagram-landscape": {
    preset: "instagram-landscape", destination: "Instagram landscape", description: "Wide feed post", label: "1080 × 566 · 1.91:1", width: 1080, height: 566,
  },
  "linkedin-feed": {
    preset: "linkedin-feed", destination: "LinkedIn Feed", description: "Feed-optimised vertical", label: "1080 × 1350 · 4:5", width: 1080, height: 1350,
  },
  "linkedin-square": {
    preset: "linkedin-square", destination: "LinkedIn square", description: "Square feed video", label: "1080 × 1080 · 1:1", width: 1080, height: 1080,
  },
  "pinterest-pin": {
    preset: "pinterest-pin", destination: "Pinterest Pin", description: "Vertical discovery format", label: "1000 × 1500 · 2:3", width: 1000, height: 1500,
  },
  "pinterest-square": {
    preset: "pinterest-square", destination: "Pinterest square", description: "Square Pin", label: "1000 × 1000 · 1:1", width: 1000, height: 1000,
  },
  "facebook-feed": {
    preset: "facebook-feed", destination: "Facebook Feed", description: "Square feed post", label: "1080 × 1080 · 1:1", width: 1080, height: 1080,
  },
  "x-post": {
    preset: "x-post", destination: "X post", description: "Square social post", label: "1080 × 1080 · 1:1", width: 1080, height: 1080,
  },
  "x-landscape": {
    preset: "x-landscape", destination: "X landscape", description: "Wide social post", label: "1200 × 675 · 16:9", width: 1200, height: 675,
  },
  "x-wide": {
    preset: "x-wide", destination: "X wide post", description: "Link-card style wide post", label: "1200 × 628 · 1.91:1", width: 1200, height: 628,
  },
  "linkedin-landscape": {
    preset: "linkedin-landscape", destination: "LinkedIn landscape", description: "Wide feed video", label: "1920 × 1080 · 16:9", width: 1920, height: 1080,
  },
};
