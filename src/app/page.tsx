import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="grid min-h-dvh place-content-center gap-4 p-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Vertara</h1>
        <p className="text-muted-foreground">
          Transform any video into its vertical story.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Your videos stay on this device.
      </p>
      <Button className="w-fit">
        <Sparkles aria-hidden="true" />
        Start a project
      </Button>
    </main>
  );
}
