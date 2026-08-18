import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,loading,error,not-found,template,default,route}.{js,jsx,ts,tsx}",
  ],
  project: ["src/**/*.{css,js,jsx,ts,tsx}"],
  // These cores are copied into public/ffmpeg by prepare:ffmpeg and loaded by URL at runtime.
  ignoreDependencies: ["@ffmpeg/core", "@ffmpeg/core-mt"],
};

export default config;
