import type { MediaDescriptor } from "@/features/media/media.types";

interface MediaSummaryProps {
  media: MediaDescriptor;
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaSummary({ media }: MediaSummaryProps) {
  return (
    <section aria-labelledby="media-summary-title" className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">Ready to edit</p>
      <h2 className="mt-1 font-semibold" id="media-summary-title">
        {media.name}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Dimensions</dt>
          <dd>{media.width} × {media.height}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd>{formatDuration(media.durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">File size</dt>
          <dd>{formatFileSize(media.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Audio</dt>
          <dd className="capitalize">{media.hasAudio}</dd>
        </div>
      </dl>
    </section>
  );
}
