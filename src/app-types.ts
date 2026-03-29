import type { Locale, MessageDescriptor } from "@/lib/copy";

export type WorkspaceKind = "heic";
export type QueueStatus = "pending" | "preparing" | "processing" | "completed" | "error" | "cancelled";
export type ToastTone = "error" | "info" | "success";
export type HeicOutputFormat = "jpg" | "png" | "webp";
export type MetadataPolicy = "keep" | "strip";
export type MetadataStatus = "available" | "limited" | "stripped" | "none";

export interface Dimensions {
  width: number;
  height: number;
}

export interface ToastState {
  id: string;
  message: MessageDescriptor;
  tone: ToastTone;
}

export interface HeicMetadata {
  orientation?: number;
  make?: string;
  model?: string;
  capturedAt?: Date;
  latitude?: number;
  longitude?: number;
}

export interface HeicConversionSettings {
  outputFormat: HeicOutputFormat;
  jpegQuality: number;
  webpQuality: number;
  metadataPolicy: MetadataPolicy;
}

export interface QueuedFile {
  id: string;
  workspace: WorkspaceKind;
  name: string;
  size: number;
  sourceFormat: "HEIC" | "HEIF";
  originalFile: File;
  status: QueueStatus;
  previewUrl?: string;
  dimensions?: Dimensions;
  metadata?: HeicMetadata;
  metadataSummary?: string;
  metadataStatus?: MetadataStatus;
  targetFormat?: HeicOutputFormat;
  detail?: MessageDescriptor;
  error?: MessageDescriptor;
  warning?: MessageDescriptor;
  progress?: number;
  resultBlob?: Blob;
  outputName?: string;
  outputType?: string;
  convertedSize?: number;
  durationMs?: number;
}

export interface LocaleState {
  active: Locale;
}
