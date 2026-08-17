import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,loading,error,not-found,template,default,route}.{js,jsx,ts,tsx}",
  ],
  project: ["src/**/*.{css,js,jsx,ts,tsx}"],
  ignoreDependencies: ["@ffmpeg/core"],
};

export default config;
