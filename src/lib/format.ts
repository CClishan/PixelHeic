import type { Dimensions } from "@/app-types";
import type { Locale } from "@/lib/copy";

export function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${parseFloat(value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2))} ${units[exponent]}`;
}

export function formatSavings(original: number, converted?: number) {
  if (!converted || original <= 0 || converted >= original) {
    return null;
  }

  return Math.round((1 - converted / original) * 100);
}

export function formatTimestamp(value = Date.now()) {
  const date = new Date(value);
  const parts = [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
    `${date.getHours()}`.padStart(2, "0"),
    `${date.getMinutes()}`.padStart(2, "0"),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}`;
}

export function sanitizeFileName(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function formatDuration(durationMs?: number) {
  if (!durationMs || durationMs <= 0) {
    return null;
  }

  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }

  const seconds = durationMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  return `${(seconds / 60).toFixed(1)}m`;
}

export function formatDate(locale: Locale, value?: Date) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatDimensions(dimensions?: Dimensions) {
  if (!dimensions) {
    return null;
  }

  return `${dimensions.width}×${dimensions.height}`;
}

export function replaceFileExtension(name: string, extension: string) {
  const cleaned = name.replace(/\.[^.]+$/, "");
  return `${cleaned}.${extension}`;
}
