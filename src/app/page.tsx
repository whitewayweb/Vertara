import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Download,
  Frame,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

const editingBenefits = [
  {
    icon: Frame,
    title: "Frame every format",
    description:
      "Turn one landscape video into a portrait, square, or social-ready edit without losing the important part.",
  },
  {
    icon: Sparkles,
    title: "Make it feel intentional",
    description:
      "Choose a focus crop, a blurred canvas, or a clean poster layout, then adjust the details yourself.",
  },
  {
    icon: LockKeyhole,
    title: "Keep footage private",
    description:
      "Your source video is edited on this device. Vertara does not upload it to a server.",
  },
];

const steps = [
  "Choose a video from your device.",
  "Trim it and choose the framing that works.",
  "Sign in only when you are ready to download.",
];

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Vertara</span>
          <form action="/editor">
            <Button size="sm" type="submit" variant="ghost">
              Open editor
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </header>

        <section className="grid items-center gap-12 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              A simpler way to reframe video
            </p>
            <h1 className="text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              Your video, ready for its next frame.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Vertara turns the footage you already have into polished vertical,
              square, and landscape edits—without making you learn a complicated
              editor.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <form action="/editor">
                <Button className="h-11 px-5" size="lg" type="submit">
                  Start editing
                  <ArrowRight aria-hidden="true" />
                </Button>
              </form>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <LockKeyhole aria-hidden="true" className="size-4" />
                No account needed to start
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-12 -z-10 rounded-full bg-primary/7 blur-3xl" />
            <div className="rounded-[2rem] border border-border bg-card p-3 shadow-2xl shadow-primary/10">
              <div className="aspect-[9/16] overflow-hidden rounded-[1.45rem] bg-[linear-gradient(155deg,#d8e8ff_0%,#8d9cae_36%,#222832_37%,#536579_100%)] p-5">
                <div className="flex h-full flex-col justify-between rounded-[1.1rem] border border-white/30 bg-black/15 p-4 text-white backdrop-blur-[1px]">
                  <div className="flex items-center justify-between text-xs font-medium tracking-wide uppercase opacity-80">
                    <span>Canvas</span>
                    <span>9:16</span>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm">
                    <p className="text-xs font-medium tracking-wider text-white/70 uppercase">
                      Your story
                    </p>
                    <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                      Keep every moment in frame.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs backdrop-blur-sm">
                    <span className="size-2 rounded-full bg-emerald-300" />
                    Preview ready
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-4 text-sm">
                <span className="font-medium">Landscape to vertical</span>
                <span className="text-muted-foreground">In minutes</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border py-16 sm:py-20">
          <p className="max-w-xl text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Made for the edit before you post
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {editingBenefits.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <div className="grid size-10 place-items-center rounded-xl bg-muted">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Start free. Download when you are ready.
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li className="rounded-2xl border border-border bg-card p-5" key={step}>
                <span className="text-sm font-medium text-muted-foreground">0{index + 1}</span>
                <p className="mt-8 font-medium leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-8 rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-14">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Bring your next video into focus.
              </h2>
              <p className="mt-3 text-primary-foreground/70">
                Edit on your device. Sign in only to download your finished video.
              </p>
            </div>
            <form action="/editor">
              <Button className="h-11 bg-background px-5 text-foreground hover:bg-background/85" size="lg" type="submit">
                <Download aria-hidden="true" />
                Create an edit
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
