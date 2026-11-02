import { AudioLines, Captions, Crop, Download, Eraser, FileText, Music, Palette, Scissors, type LucideIcon } from "lucide-react";

/** The one plain-language description of what Vertara does, shared by the landing and import pages. */
export const productFeatures: Array<{ description: string; icon: LucideIcon; title: string }> = [
  { icon: Captions, title: "Auto captions", description: "Your speech becomes word-by-word subtitles. Download them as SRT or VTT too." },
  { icon: Scissors, title: "Remove pauses and “ums”", description: "Cut dead air and filler words in one click." },
  { icon: FileText, title: "Edit by text", description: "Click a word in your transcript to cut it from the video." },
  { icon: Crop, title: "Keep your face in frame", description: "Turn a wide video vertical, with the crop following you." },
  { icon: Eraser, title: "Replace your background", description: "Blur it or swap it for a colour, with no green screen." },
  { icon: AudioLines, title: "Better sound", description: "Even out your volume and reduce background noise." },
  { icon: Music, title: "Music and beat cuts", description: "Add a song, lower it when you talk, and cut on the beat." },
  { icon: Palette, title: "Your brand kit", description: "Save your logo, colours, and font for every video." },
  { icon: Download, title: "Every format at once", description: "Export vertical, square, portrait, and landscape from one edit." },
];
