import type { Dimensions, HeicConversionSettings, HeicMetadata, MetadataStatus } from "@/app-types";
import { injectJpegMetadata, hasMeaningfulMetadata } from "@/lib/exif";
import { replaceFileExtension } from "@/lib/format";

export interface PreparedHeic {
  isHeic: boolean;
  dimensions?: Dimensions;
  previewUrl?: string;
}

export interface HeicConversionResult {
  file: File;
  dimensions: Dimensions;
  metadataStatus: MetadataStatus;
  warning?: string;
  durationMs: number;
}

type HeicModule = typeof import("heic-to/next");

let heicModulePromise: Promise<HeicModule> | null = null;

async function loadHeicModule() {
  if (!heicModulePromise) {
    heicModulePromise = import("heic-to/next");
  }

  return heicModulePromise;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : new DOMException("Aborted", "AbortError");
  }
}

function normalizeOrientation(value?: number) {
  return value && value >= 2 && value <= 8 ? value : 1;
}

function outputMime(format: HeicConversionSettings["outputFormat"]) {
  switch (format) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function outputQuality(settings: HeicConversionSettings) {
  switch (settings.outputFormat) {
    case "jpg":
      return settings.jpegQuality / 100;
    case "webp":
      return settings.webpQuality / 100;
    case "png":
    default:
      return undefined;
  }
}

function buildOutputName(name: string, format: HeicConversionSettings["outputFormat"]) {
  return replaceFileExtension(name, format);
}

function getCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  return { canvas, context };
}

function getOrientedSize(width: number, height: number, orientation: number) {
  if ([5, 6, 7, 8].includes(orientation)) {
    return { width: height, height: width };
  }

  return { width, height };
}

function drawBitmap(bitmap: ImageBitmap, orientation: number, maxEdge?: number) {
  const oriented = getOrientedSize(bitmap.width, bitmap.height, orientation);
  const scale = maxEdge ? Math.min(1, maxEdge / Math.max(oriented.width, oriented.height)) : 1;
  const targetWidth = Math.max(1, Math.round(oriented.width * scale));
  const targetHeight = Math.max(1, Math.round(oriented.height * scale));
  const sourceWidth = Math.max(1, Math.round(bitmap.width * scale));
  const sourceHeight = Math.max(1, Math.round(bitmap.height * scale));
  const { canvas, context } = getCanvas(targetWidth, targetHeight);

  context.translate(targetWidth / 2, targetHeight / 2);

  switch (orientation) {
    case 2:
      context.scale(-1, 1);
      break;
    case 3:
      context.rotate(Math.PI);
      break;
    case 4:
      context.scale(1, -1);
      break;
    case 5:
      context.rotate(0.5 * Math.PI);
      context.scale(1, -1);
      break;
    case 6:
      context.rotate(0.5 * Math.PI);
      break;
    case 7:
      context.rotate(0.5 * Math.PI);
      context.scale(-1, 1);
      break;
    case 8:
      context.rotate(-0.5 * Math.PI);
      break;
    default:
      break;
  }

  context.drawImage(bitmap, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

  return { canvas, dimensions: { width: targetWidth, height: targetHeight } };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to export image data."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function decodeBitmap(file: File, signal?: AbortSignal) {
  throwIfAborted(signal);
  const { heicTo } = await loadHeicModule();
  const bitmap = await heicTo({ blob: file, type: "bitmap" });
  throwIfAborted(signal);
  return bitmap;
}

export async function prepareHeicFile(file: File, metadata?: HeicMetadata, signal?: AbortSignal): Promise<PreparedHeic> {
  const { isHeic } = await loadHeicModule();
  const heic = await isHeic(file);
  throwIfAborted(signal);

  if (!heic) {
    return { isHeic: false };
  }

  const bitmap = await decodeBitmap(file, signal);
  try {
    const orientation = normalizeOrientation(metadata?.orientation);
    const orientedDimensions = getOrientedSize(bitmap.width, bitmap.height, orientation);
    const { canvas } = drawBitmap(bitmap, orientation, 360);
    let previewUrl: string | undefined;

    try {
      const previewBlob = await canvasToBlob(canvas, "image/jpeg", 0.82);
      previewUrl = URL.createObjectURL(previewBlob);
    } catch {
      previewUrl = undefined;
    }

    return {
      isHeic: true,
      dimensions: orientedDimensions,
      previewUrl,
    };
  } finally {
    bitmap.close();
  }
}

export async function convertHeicFile(
  file: File,
  settings: HeicConversionSettings,
  metadata: HeicMetadata | undefined,
  signal?: AbortSignal,
  onStage?: (stage: "decode" | "encode" | "metadata") => void,
): Promise<HeicConversionResult> {
  const startedAt = performance.now();
  onStage?.("decode");
  const bitmap = await decodeBitmap(file, signal);

  try {
    const orientation = normalizeOrientation(metadata?.orientation);
    const { canvas, dimensions } = drawBitmap(bitmap, orientation);
    throwIfAborted(signal);
    onStage?.("encode");
    let blob = await canvasToBlob(canvas, outputMime(settings.outputFormat), outputQuality(settings));
    throwIfAborted(signal);

    let metadataStatus: MetadataStatus = "none";
    let warning: string | undefined;
    const hasMetadata = hasMeaningfulMetadata(metadata);

    if (settings.metadataPolicy === "strip") {
      metadataStatus = hasMetadata ? "stripped" : "none";
    } else if (settings.outputFormat === "jpg") {
      if (hasMetadata) {
        onStage?.("metadata");
        try {
          blob = await injectJpegMetadata(blob, metadata, dimensions);
          metadataStatus = "available";
        } catch {
          metadataStatus = "limited";
          warning = "metadataWriteFailed";
        }
      } else {
        metadataStatus = "none";
      }
    } else {
      metadataStatus = hasMetadata ? "limited" : "none";
      if (hasMetadata) {
        warning = "metadataLimitedPngWebp";
      }
    }

    throwIfAborted(signal);
    return {
      file: new File([blob], buildOutputName(file.name, settings.outputFormat), {
        type: outputMime(settings.outputFormat),
        lastModified: Date.now(),
      }),
      dimensions,
      metadataStatus,
      warning,
      durationMs: performance.now() - startedAt,
    };
  } finally {
    bitmap.close();
  }
}
