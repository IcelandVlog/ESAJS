import type { CSSProperties } from "react";

// A single line of admin-authored text with its own styling — used for both
// a gallery photo's header and each line of its details.
export type StyledLine = {
  text: string;
  color: string; // hex, e.g. "#101f3d"
  fontSize: number; // px
  style: "normal" | "italic" | "bold" | "bold-italic";
};

export type GalleryContent = {
  header: StyledLine;
  lines: StyledLine[];
};

export type GalleryPhoto = {
  id: number;
  imageUrl: string;
  content: string; // raw JSON string as stored in the DB — parse with parseGalleryContent
  createdAt: Date | string | null;
};

export const DEFAULT_LINE: StyledLine = {
  text: "",
  color: "#10172A",
  fontSize: 16,
  style: "normal",
};

export const DEFAULT_HEADER: StyledLine = {
  text: "",
  color: "#101f3d",
  fontSize: 22,
  style: "bold",
};

export function styledLineCss(line: StyledLine): CSSProperties {
  return {
    color: line.color,
    fontSize: line.fontSize,
    fontStyle: line.style === "italic" || line.style === "bold-italic" ? "italic" : "normal",
    fontWeight: line.style === "bold" || line.style === "bold-italic" ? 700 : 400,
  };
}

// Safely parse the JSON `content` column, falling back to empty defaults if
// a row is missing/malformed data rather than throwing on the page.
export function parseGalleryContent(raw: string): GalleryContent {
  try {
    const parsed = JSON.parse(raw);
    return {
      header: { ...DEFAULT_HEADER, ...(parsed.header || {}) },
      lines: Array.isArray(parsed.lines) ? parsed.lines.map((l: Partial<StyledLine>) => ({ ...DEFAULT_LINE, ...l })) : [],
    };
  } catch {
    return { header: { ...DEFAULT_HEADER }, lines: [] };
  }
}

// Used by the public gallery "feature" layout. The admin's colour / size are only
// applied when they picked something other than the defaults — otherwise the page's
// own theme-aware colours and larger sizes are used, so text stays readable on
// both the dark and light theme. Bold / italic always follow the admin's choice.
export function featureLineStyle(line: StyledLine, defaults: StyledLine): CSSProperties {
  const style: CSSProperties = {};
  if (line.color.toLowerCase() !== defaults.color.toLowerCase()) style.color = line.color;
  if (line.style === "italic" || line.style === "bold-italic") style.fontStyle = "italic";
  if (line.style === "bold" || line.style === "bold-italic") style.fontWeight = 700;
  return style;
}

export function usesCustomColor(line: StyledLine, defaults: StyledLine): boolean {
  return line.color.toLowerCase() !== defaults.color.toLowerCase();
}
export function usesCustomSize(line: StyledLine, defaults: StyledLine): boolean {
  return line.fontSize !== defaults.fontSize;
}
