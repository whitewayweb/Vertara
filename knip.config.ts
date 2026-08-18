import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,loading,error,not-found,template,default,route}.{js,jsx,ts,tsx}",
  ],
  // shadcn/ui modules expose reusable public APIs that may be consumed by future features.
  ignoreIssues: {
    "src/components/ui/**": ["exports"],
  },
  project: ["src/**/*.{css,js,jsx,ts,tsx}"],
};

export default config;
