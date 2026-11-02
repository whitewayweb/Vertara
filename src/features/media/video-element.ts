/** Loads a local video into an off-screen element for frame-accurate reading. */
export async function loadVideoElement(sourceUrl: string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("The source video cannot be decoded in this browser."));
  });
  return video;
}

export async function seekVideoElement(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 0.001) return;
  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("The source video could not be read at this point."));
    video.currentTime = time;
  });
}

/** Frees the browser's video decoder right away. Removing the element alone keeps it until garbage collection, which can stall the preview. */
export function releaseVideoElement(video: HTMLVideoElement): void {
  video.removeAttribute("src");
  video.load();
}
