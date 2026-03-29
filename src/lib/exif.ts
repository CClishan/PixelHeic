import exifr from "exifr";
import piexif from "piexifjs";
import type { Dimensions, HeicMetadata } from "@/app-types";

function normalizeDate(input: unknown) {
  if (input instanceof Date && !Number.isNaN(input.valueOf())) {
    return input;
  }

  if (typeof input === "string" || typeof input === "number") {
    const value = new Date(input);
    if (!Number.isNaN(value.valueOf())) {
      return value;
    }
  }

  return undefined;
}

function formatExifDate(date: Date) {
  const parts = [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
    `${date.getHours()}`.padStart(2, "0"),
    `${date.getMinutes()}`.padStart(2, "0"),
    `${date.getSeconds()}`.padStart(2, "0"),
  ];

  return `${parts[0]}:${parts[1]}:${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
}

function toRational(value: number) {
  const denominator = 10000;
  return [Math.round(value * denominator), denominator] as [number, number];
}

function decimalToDmsRational(value: number) {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return [[degrees, 1], [minutes, 1], toRational(seconds)] as [number, number][];
}

function dataUrlToBlob(dataUrl: string) {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const binary = atob(payload);
  const buffer = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }

  return new Blob([buffer], { type: mime });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob as data URL."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export function hasMeaningfulMetadata(metadata?: HeicMetadata) {
  if (!metadata) {
    return false;
  }

  return Boolean(metadata.capturedAt || metadata.make || metadata.model || typeof metadata.latitude === "number" || typeof metadata.longitude === "number");
}

export async function extractHeicMetadata(file: File): Promise<HeicMetadata | undefined> {
  const [parsed, gps] = await Promise.all([
    exifr.parse(file, {
      pick: ["Orientation", "Make", "Model", "DateTimeOriginal", "CreateDate"],
      reviveValues: true,
      translateValues: true,
    }) as Promise<Record<string, unknown> | undefined>,
    exifr.gps(file).catch(() => undefined) as Promise<{ latitude?: number; longitude?: number } | undefined>,
  ]);

  if (!parsed && !gps) {
    return undefined;
  }

  const metadata: HeicMetadata = {
    orientation: typeof parsed?.Orientation === "number" ? parsed.Orientation : undefined,
    make: typeof parsed?.Make === "string" ? parsed.Make : undefined,
    model: typeof parsed?.Model === "string" ? parsed.Model : undefined,
    capturedAt: normalizeDate(parsed?.DateTimeOriginal ?? parsed?.CreateDate),
    latitude: typeof gps?.latitude === "number" ? gps.latitude : undefined,
    longitude: typeof gps?.longitude === "number" ? gps.longitude : undefined,
  };

  return metadata;
}

export async function injectJpegMetadata(blob: Blob, metadata: HeicMetadata | undefined, dimensions: Dimensions) {
  if (!hasMeaningfulMetadata(metadata)) {
    return blob;
  }

  const exif: piexif.ExifDict = {
    "0th": {
      [piexif.ImageIFD.Orientation]: 1,
      [piexif.ImageIFD.Software]: "PixelHeic",
    },
    Exif: {
      [piexif.ExifIFD.PixelXDimension]: dimensions.width,
      [piexif.ExifIFD.PixelYDimension]: dimensions.height,
    },
    GPS: {},
  };

  if (metadata?.make) {
    exif["0th"]![piexif.ImageIFD.Make] = metadata.make;
  }

  if (metadata?.model) {
    exif["0th"]![piexif.ImageIFD.Model] = metadata.model;
  }

  if (metadata?.capturedAt) {
    const exifDate = formatExifDate(metadata.capturedAt);
    exif["0th"]![piexif.ImageIFD.DateTime] = exifDate;
    exif.Exif![piexif.ExifIFD.DateTimeOriginal] = exifDate;
    exif.Exif![piexif.ExifIFD.DateTimeDigitized] = exifDate;
  }

  if (typeof metadata?.latitude === "number" && typeof metadata?.longitude === "number") {
    exif.GPS![piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
    exif.GPS![piexif.GPSIFD.GPSLatitudeRef] = metadata.latitude >= 0 ? "N" : "S";
    exif.GPS![piexif.GPSIFD.GPSLatitude] = decimalToDmsRational(metadata.latitude);
    exif.GPS![piexif.GPSIFD.GPSLongitudeRef] = metadata.longitude >= 0 ? "E" : "W";
    exif.GPS![piexif.GPSIFD.GPSLongitude] = decimalToDmsRational(metadata.longitude);
  }

  const dumped = piexif.dump(exif);
  const source = await blobToDataUrl(blob);
  const withExif = piexif.insert(dumped, source);
  return dataUrlToBlob(withExif);
}
