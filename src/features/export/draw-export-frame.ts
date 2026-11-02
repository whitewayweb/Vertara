import { getLogoBox } from "@/features/brand/brand-kit";
import { createCaptionLines, getActiveCaption, type CaptionLine } from "@/features/captions/captions";
import { getTextOverlayEntranceProgress, getTextOverlayFontStack, isTextOverlayVisible, type TextOverlay } from "@/features/project/text-overlays";
import { getFocusPanAt } from "@/features/render/focus-track";
import type { ProjectRenderState } from "@/features/render/project-render";
import { getVideoAdjustmentsFilter, type VideoAdjustments } from "@/features/render/video-adjustments";

export interface FrameImage {
  height: number;
  image: CanvasImageSource;
  width: number;
}

export interface ExportFrameAssets {
  captionLines: CaptionLine[];
  logo?: HTMLImageElement;
}

export async function prepareExportFrameAssets(project: ProjectRenderState): Promise<ExportFrameAssets> {
  return {
    captionLines: project.captions.enabled ? createCaptionLines(project.transcript, project.playback) : [],
    logo: project.brand.logoDataUrl ? await loadImage(project.brand.logoDataUrl) : undefined,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Your brand logo could not be read."));
    image.src = url;
  });
}

export function drawExportFrame(context: CanvasRenderingContext2D, frame: FrameImage, backdrop: FrameImage, project: ProjectRenderState, assets: ExportFrameAssets, sourceSeconds: number, outputSeconds: number): void {
  const { height, width } = project.output;
  const { canvasLayout, focusLayout, mode, posterLayout, videoAdjustments } = project;
  context.clearRect(0, 0, width, height);
  if (mode === "poster") {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6d28d9"); gradient.addColorStop(0.5, "#c026d3"); gradient.addColorStop(1, "#fb923c");
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
    context.fillStyle = "white"; context.font = `600 ${Math.round(width * 0.07)}px sans-serif`; context.fillText(posterLayout.headline || "Your story", width * 0.06, height * 0.12, width * 0.88);
    if (posterLayout.subline) { context.fillStyle = "rgba(255,255,255,0.8)"; context.font = `400 ${Math.round(width * 0.036)}px sans-serif`; context.fillText(posterLayout.subline, width * 0.06, height * 0.17, width * 0.88); }
    drawAdjustedContain(context, frame, width * 0.06, height * 0.28, width * 0.88, height * 0.62, videoAdjustments);
  } else if (mode === "focus") {
    drawAdjustedCover(context, frame, 0, 0, width, height, getFocusPanAt(focusLayout.track ?? [], sourceSeconds, focusLayout.panX), focusLayout.zoom, videoAdjustments);
  } else {
    context.save(); context.filter = `blur(${canvasLayout.backdropBlurPixels}px) ${getVideoAdjustmentsFilter(videoAdjustments)}`; context.globalAlpha = canvasLayout.backdropOpacity;
    drawCover(context, backdrop, 0, 0, width, height, 50, 1.1); context.restore();
    context.fillStyle = `rgba(0,0,0,${canvasLayout.dimOpacity})`; context.fillRect(0, 0, width, height);
    drawAdjustedContain(context, frame, 0, 0, width, height, videoAdjustments);
  }
  drawCaptions(context, project, assets.captionLines, sourceSeconds);
  drawTextOverlays(context, project.overlays, outputSeconds, width, height);
  if (assets.logo) {
    const box = getLogoBox(project.brand.logoCorner, project.brand.logoSizePercent, width, height, assets.logo.naturalWidth, assets.logo.naturalHeight);
    context.drawImage(assets.logo, box.x, box.y, box.width, box.height);
  }
}

function drawCaptions(context: CanvasRenderingContext2D, project: ProjectRenderState, lines: CaptionLine[], sourceSeconds: number): void {
  const active = getActiveCaption(lines, sourceSeconds);
  if (!active) return;
  const { height, width } = project.output;
  const { backgroundColor, color, fontFamily, highlightColor, sizePercent, verticalPositionPercent } = project.captions;
  const fontSize = Math.round(width * (sizePercent / 100));
  const lineHeight = fontSize * 1.25;
  const maximumRowWidth = width * 0.86;
  context.save();
  context.font = `800 ${fontSize}px ${getTextOverlayFontStack(fontFamily)}`;
  context.textBaseline = "middle";
  context.lineJoin = "round";
  const spaceWidth = context.measureText(" ").width;
  const rows: Array<{ width: number; words: Array<{ id: string; text: string; width: number }> }> = [];
  for (const word of active.line.words) {
    const wordWidth = context.measureText(word.text).width;
    const row = rows.at(-1);
    if (row && row.width + spaceWidth + wordWidth <= maximumRowWidth) { row.words.push({ id: word.id, text: word.text, width: wordWidth }); row.width += spaceWidth + wordWidth; }
    else rows.push({ width: wordWidth, words: [{ id: word.id, text: word.text, width: wordWidth }] });
  }
  const firstRowCenter = height * (verticalPositionPercent / 100) - ((rows.length - 1) * lineHeight) / 2;
  rows.forEach((row, rowIndex) => {
    const rowCenter = firstRowCenter + rowIndex * lineHeight;
    let x = (width - row.width) / 2;
    if (backgroundColor !== "transparent") {
      const padding = fontSize * 0.25;
      context.fillStyle = backgroundColor;
      fillRoundedRect(context, x - padding, rowCenter - lineHeight / 2, row.width + padding * 2, lineHeight, padding);
    }
    for (const word of row.words) {
      if (backgroundColor === "transparent") {
        context.lineWidth = fontSize * 0.14;
        context.strokeStyle = "#000000";
        context.strokeText(word.text, x, rowCenter);
      }
      context.fillStyle = word.id === active.activeWordId ? highlightColor : color;
      context.fillText(word.text, x, rowCenter);
      x += word.width + spaceWidth;
    }
  });
  context.restore();
}

function drawTextOverlays(context: CanvasRenderingContext2D, overlays: TextOverlay[], elapsedSeconds: number, width: number, height: number): void {
  overlays.filter((overlay) => isTextOverlayVisible(overlay, elapsedSeconds)).forEach((overlay) => drawTextOverlay(context, overlay, elapsedSeconds, width, height));
}

function drawTextOverlay(
  context: CanvasRenderingContext2D,
  overlay: TextOverlay,
  elapsedSeconds: number,
  width: number,
  height: number,
): void {
  const fontSize = Math.round(width * (overlay.fontSizePercent / 100));
  const font = `800 ${fontSize}px ${getTextOverlayFontStack(overlay.fontFamily)}`;
  const maxWidth = width * (overlay.widthPercent / 100) - fontSize * 0.36;
  const lines = wrapText(context, overlay.text.trim(), font, maxWidth);
  const lineHeight = Math.round(fontSize * 1.2);
  const textHeight = lines.length * lineHeight;

  context.save();
  context.font = font;
  context.textAlign = overlay.textAlign;
  context.textBaseline = "top";
  const padding = fontSize * 0.18;
  const boxWidth = width * (overlay.widthPercent / 100);
  const boxHeight = textHeight + padding * 2;
  const x = width * (overlay.horizontalPositionPercent / 100);
  const y = height * (overlay.verticalPositionPercent / 100) - boxHeight / 2;
  const entranceProgress = getTextOverlayEntranceProgress(overlay, elapsedSeconds);
  const opacity = overlay.entranceAnimation === "none" ? 1 : entranceProgress;
  const scale = overlay.entranceAnimation === "pop" ? 0.72 + entranceProgress * 0.28 : 1;
  const slideOffset = overlay.entranceAnimation === "slide-up" ? fontSize * 0.65 * (1 - entranceProgress) : 0;
  context.globalAlpha = opacity;
  context.translate(x, y + boxHeight / 2 + slideOffset);
  context.scale(scale, scale);
  context.translate(-x, -(y + boxHeight / 2));
  const textX = overlay.textAlign === "left" ? x - boxWidth / 2 + padding : overlay.textAlign === "right" ? x + boxWidth / 2 - padding : x;
  if (overlay.backgroundColor !== "transparent" && overlay.backgroundStyle !== "none") {
    context.fillStyle = overlay.backgroundColor;
    if (overlay.backgroundStyle === "highlight") {
      lines.forEach((line, index) => {
        const lineWidth = context.measureText(line).width;
        const lineX = overlay.textAlign === "left" ? textX : overlay.textAlign === "right" ? textX - lineWidth : textX - lineWidth / 2;
        fillRoundedRect(context, lineX - padding * 0.35, y + padding + index * lineHeight - padding * 0.12, lineWidth + padding * 0.7, lineHeight, padding * 0.4);
      });
    } else if (overlay.backgroundStyle === "pill") {
      fillRoundedRect(context, x - boxWidth / 2, y, boxWidth, boxHeight, boxHeight / 2);
    } else {
      context.fillRect(x - boxWidth / 2, y, boxWidth, boxHeight);
    }
  }
  const hasStroke = overlay.strokeColor !== "transparent" && overlay.strokeWidthPercent > 0;
  const drawLines = () => lines.forEach((line, index) => {
    const textY = y + padding + index * lineHeight;
    if (hasStroke) context.strokeText(line, textX, textY);
    context.fillText(line, textX, textY);
  });
  context.fillStyle = overlay.color;
  if (hasStroke) {
    context.lineWidth = fontSize * (overlay.strokeWidthPercent / 100);
    context.strokeStyle = overlay.strokeColor;
  }
  const drawShadow = (color: string, blur: number, offsetX: number, offsetY: number) => {
    context.save();
    context.shadowBlur = blur;
    context.shadowColor = color;
    context.shadowOffsetX = offsetX;
    context.shadowOffsetY = offsetY;
    drawLines();
    context.restore();
  };
  if (overlay.shadowColor !== "transparent" && overlay.shadowSpreadPercent > 0) drawShadow(overlay.shadowColor, fontSize * (overlay.shadowSpreadPercent / 100), 0, 0);
  if (overlay.dropShadowColor !== "transparent" && (overlay.dropShadowBlurPercent > 0 || overlay.dropShadowOffsetXPercent !== 0 || overlay.dropShadowOffsetYPercent !== 0)) drawShadow(overlay.dropShadowColor, fontSize * (overlay.dropShadowBlurPercent / 100), fontSize * (overlay.dropShadowOffsetXPercent / 100), fontSize * (overlay.dropShadowOffsetYPercent / 100));
  drawLines();
  context.restore();
}

function fillRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function wrapText(context: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  context.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawContain(context: CanvasRenderingContext2D, frame: FrameImage, x: number, y: number, width: number, height: number): void {
  const scale = Math.min(width / frame.width, height / frame.height); const drawWidth = frame.width * scale; const drawHeight = frame.height * scale;
  context.drawImage(frame.image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawAdjustedContain(context: CanvasRenderingContext2D, frame: FrameImage, x: number, y: number, width: number, height: number, adjustments: VideoAdjustments): void {
  drawWithVideoAdjustments(context, adjustments, () => drawContain(context, frame, x, y, width, height));
}

function drawCover(context: CanvasRenderingContext2D, frame: FrameImage, x: number, y: number, width: number, height: number, panX: number, zoom: number): void {
  const scale = Math.max(width / frame.width, height / frame.height) * zoom; const drawWidth = frame.width * scale; const drawHeight = frame.height * scale;
  context.drawImage(frame.image, x + (width - drawWidth) * (panX / 100), y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawAdjustedCover(context: CanvasRenderingContext2D, frame: FrameImage, x: number, y: number, width: number, height: number, panX: number, zoom: number, adjustments: VideoAdjustments): void {
  drawWithVideoAdjustments(context, adjustments, () => drawCover(context, frame, x, y, width, height, panX, zoom));
}

function drawWithVideoAdjustments(context: CanvasRenderingContext2D, adjustments: VideoAdjustments, draw: () => void): void {
  context.save(); context.filter = getVideoAdjustmentsFilter(adjustments); draw(); context.restore();
}
