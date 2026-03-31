export type Locale = "en" | "zh";

export interface MessageDescriptor {
  key?: string;
  raw?: string;
  values?: Record<string, string | number | undefined>;
}

export interface LocalizedCopy {
  locale: Locale;
  siteTitle: string;
  siteSubtitle: string;
  queueTitle: string;
  configurationTitle: string;
  currentWorkspace: string;
  closeToastLabel: string;
  languageOptionEnglish: string;
  languageOptionChinese: string;
  workspaceLabel: string;
  cards: {
    local: string;
    output: string;
    metadata: string;
  };
  status: {
    ready: string;
    metadataAvailable: string;
    metadataLimited: string;
    metadataStripped: string;
    metadataNone: string;
  };
  dropzone: {
    title: string;
    subtitle: string;
    hint: string;
    compactTitle: string;
    compactHint: string;
  };
  settings: {
    outputFormat: string;
    jpegQuality: string;
    webpQuality: string;
    metadataPolicy: string;
    keepMetadata: string;
    stripMetadata: string;
    localNoticeTitle: string;
    localNoticeBody: string;
    metadataNoticeTitle: string;
    metadataNoticeKeepJpg: string;
    metadataNoticeKeepLimited: string;
    metadataNoticeStrip: string;
  };
  actions: {
    convert: string;
    converting: string;
    download: string;
    downloadZip: string;
    clear: string;
    remove: string;
    cancel: string;
    jumpToSettings: string;
  };
  empty: {
    queue: string;
    downloads: string;
  };
  credits: {
    title: string;
    body: string;
    chips: string[];
  };
  templates: Record<string, string>;
}

const STORAGE_KEY = "pixelheic-locale";

const copyByLocale: Record<Locale, LocalizedCopy> = {
  en: {
    locale: "en",
    siteTitle: "PixelHeic",
    siteSubtitle: "",
    queueTitle: "HEIC queue",
    configurationTitle: "Configuration",
    currentWorkspace: "HEIC",
    closeToastLabel: "Close notification",
    languageOptionEnglish: "EN",
    languageOptionChinese: "中文",
    workspaceLabel: "Workspace",
    cards: {
      local: "Local-first",
      output: "Output",
      metadata: "Metadata",
    },
    status: {
      ready: "READY",
      metadataAvailable: "Exif kept",
      metadataLimited: "Limited",
      metadataStripped: "Stripped",
      metadataNone: "No metadata",
    },
    dropzone: {
      title: "Drag, drop, or browse HEIC / HEIF",
      subtitle: "",
      hint: "HEIC / HEIF · up to 50 MB each",
      compactTitle: "Add more HEIC / HEIF photos",
      compactHint: "JPG · PNG · WEBP",
    },
    settings: {
      outputFormat: "Output format",
      jpegQuality: "JPEG quality",
      webpQuality: "WEBP quality",
      metadataPolicy: "Metadata policy",
      keepMetadata: "Keep metadata",
      stripMetadata: "Strip metadata",
      localNoticeTitle: "Browser-side processing",
      localNoticeBody: "Files stay on the device. Decode, convert, and download all happen locally in the browser.",
      metadataNoticeTitle: "Metadata retention",
      metadataNoticeKeepJpg: "JPG exports try to keep key EXIF fields: capture time, camera info, and GPS when present.",
      metadataNoticeKeepLimited: "PNG and WEBP do not guarantee full metadata retention in v1. Reliable EXIF write-back is only provided for JPG.",
      metadataNoticeStrip: "Strip mode exports clean files and does not write source EXIF back into the result.",
    },
    actions: {
      convert: "Convert queue",
      converting: "Converting...",
      download: "Download",
      downloadZip: "Download ZIP",
      clear: "Clear workspace",
      remove: "Remove",
      cancel: "Cancel",
      jumpToSettings: "Settings",
    },
    empty: {
      queue: "No HEIC photos in the queue",
      downloads: "No completed output yet",
    },
    credits: {
      title: "Notes",
      body: "Live Photo and multi-frame HEIC files export only the first still frame in v1. Built with browser-side decode, EXIF parsing, and ZIP export.",
      chips: ["heic-to", "exifr", "piexifjs", "JSZip", "Vercel"],
    },
    templates: {
      unsupportedFileType: "Unsupported file type: {{name}}",
      fileTooLarge: "File too large (max {{maxMb}} MB): {{name}}",
      largeFileWarning: "{{name}} is large. Browser-side decode may take longer on this device.",
      queueCleared: "HEIC queue cleared.",
      noFilesToConvert: "There are no files ready to convert.",
      noDownloadsReady: "There is no completed output to download yet.",
      validatingHeic: "Checking file structure...",
      preparingPreview: "Preparing preview and metadata...",
      readyForConversion: "Ready for local conversion.",
      previewFailed: "Preview generation failed, but the file can still be converted.",
      decodingHeic: "Decoding HEIC locally...",
      encodingOutput: "Encoding {{format}} locally...",
      restoringMetadata: "Writing key JPG EXIF back...",
      convertedToFormat: "Converted to {{format}} and ready to download.",
      keptMetadataJpg: "Key JPG EXIF restored where available.",
      metadataLimitedPngWebp: "PNG and WEBP exports may lose source metadata in v1.",
      metadataRemoved: "Metadata was removed from the export.",
      metadataMissing: "No source metadata was found to carry forward.",
      unsupportedHeicContent: "{{name}} is not a readable HEIC / HEIF file.",
      downloadReady: "Downloaded {{name}}.",
      preparedZip: "Prepared {{count}} files in {{name}}.",
      conversionFinished: "Queue conversion finished.",
      conversionCancelled: "Conversion cancelled.",
      conversionFailed: "Conversion failed in this browser.",
      singleFrameNotice: "Only the first still frame is exported in v1.",
      metadataWriteFailed: "JPG conversion succeeded, but writing metadata back failed.",
      metadataKeepSummary: "JPG keeps key EXIF when possible.",
      metadataLimitedSummary: "PNG / WEBP may lose metadata.",
      metadataStripSummary: "Exports without source EXIF.",
      outputSummary: "{{format}} output · {{count}} ready",
      localSummary: "Browser-side decode, canvas export, ZIP download.",
      queueCount: "{{count}} items",
    },
  },
  zh: {
    locale: "zh",
    siteTitle: "PixelHeic",
    siteSubtitle: "",
    queueTitle: "HEIC 队列",
    configurationTitle: "Configuration",
    currentWorkspace: "HEIC",
    closeToastLabel: "关闭提示",
    languageOptionEnglish: "EN",
    languageOptionChinese: "中文",
    workspaceLabel: "工作区",
    cards: {
      local: "本地处理",
      output: "输出",
      metadata: "元数据",
    },
    status: {
      ready: "READY",
      metadataAvailable: "保留 EXIF",
      metadataLimited: "有限保留",
      metadataStripped: "已移除",
      metadataNone: "无元数据",
    },
    dropzone: {
      title: "拖拽、释放或点击选择 HEIC / HEIF",
      subtitle: "",
      hint: "HEIC / HEIF · 单个文件不超过 50 MB",
      compactTitle: "继续添加 HEIC / HEIF",
      compactHint: "JPG · PNG · WEBP",
    },
    settings: {
      outputFormat: "输出格式",
      jpegQuality: "JPEG 质量",
      webpQuality: "WEBP 质量",
      metadataPolicy: "元数据策略",
      keepMetadata: "尽量保留",
      stripMetadata: "移除元数据",
      localNoticeTitle: "浏览器本地处理",
      localNoticeBody: "文件留在当前设备。解码、转换和下载都在浏览器里完成。",
      metadataNoticeTitle: "元数据保留说明",
      metadataNoticeKeepJpg: "导出 JPG 时，会尽量写回关键 EXIF：拍摄时间、设备信息和 GPS（如果源文件里有）。",
      metadataNoticeKeepLimited: "v1 里 PNG 和 WEBP 不保证完整保留元数据。当前只对 JPG 提供稳定的 EXIF 回写。",
      metadataNoticeStrip: "移除模式会导出更干净的结果文件，不再写回源文件 EXIF。",
    },
    actions: {
      convert: "开始转换",
      converting: "转换中...",
      download: "下载",
      downloadZip: "下载 ZIP",
      clear: "清空工作区",
      remove: "移除",
      cancel: "取消",
      jumpToSettings: "设置",
    },
    empty: {
      queue: "队列里还没有 HEIC 照片",
      downloads: "还没有可下载的结果",
    },
    credits: {
      title: "说明",
      body: "Live Photo 和多帧 HEIC 在 v1 里只导出第一张静态画面。当前方案基于浏览器端 HEIC 解码、EXIF 读取和 ZIP 打包。",
      chips: ["heic-to", "exifr", "piexifjs", "JSZip", "Vercel"],
    },
    templates: {
      unsupportedFileType: "不支持的文件类型：{{name}}",
      fileTooLarge: "文件过大（最大 {{maxMb}} MB）：{{name}}",
      largeFileWarning: "{{name}} 文件较大，当前设备上的本地解码可能更慢。",
      queueCleared: "已清空 HEIC 队列。",
      noFilesToConvert: "当前没有可转换的文件。",
      noDownloadsReady: "当前还没有可下载的结果文件。",
      validatingHeic: "正在检查文件结构...",
      preparingPreview: "正在准备预览和元数据...",
      readyForConversion: "已就绪，可以开始本地转换。",
      previewFailed: "预览生成失败，但文件仍然可以继续转换。",
      decodingHeic: "正在本地解码 HEIC...",
      encodingOutput: "正在本地编码 {{format}}...",
      restoringMetadata: "正在回写关键 JPG EXIF...",
      convertedToFormat: "已转换为 {{format}}，可以下载。",
      keptMetadataJpg: "已尽量回写关键 JPG EXIF。",
      metadataLimitedPngWebp: "v1 里 PNG 和 WEBP 可能无法完整保留源元数据。",
      metadataRemoved: "导出结果已移除元数据。",
      metadataMissing: "源文件里没有可继续保留的元数据。",
      unsupportedHeicContent: "{{name}} 不是可读取的 HEIC / HEIF 文件。",
      downloadReady: "已下载 {{name}}。",
      preparedZip: "已将 {{count}} 个文件打包为 {{name}}。",
      conversionFinished: "队列转换完成。",
      conversionCancelled: "转换已取消。",
      conversionFailed: "当前浏览器里转换失败。",
      singleFrameNotice: "v1 只导出第一张静态画面。",
      metadataWriteFailed: "JPG 已成功导出，但回写元数据失败。",
      metadataKeepSummary: "JPG 会尽量保留关键 EXIF。",
      metadataLimitedSummary: "PNG / WEBP 可能丢失元数据。",
      metadataStripSummary: "导出结果不保留源 EXIF。",
      outputSummary: "{{format}} 输出 · 已完成 {{count}} 个",
      localSummary: "浏览器内解码、canvas 导出、ZIP 下载。",
      queueCount: "{{count}} 项",
    },
  },
};

export function getCopy(locale: Locale) {
  return copyByLocale[locale];
}

export function message(key: string, values?: Record<string, string | number | undefined>): MessageDescriptor {
  return { key, values };
}

export function rawMessage(raw: string): MessageDescriptor {
  return { raw };
}

export function formatTemplate(template: string, values: Record<string, string | number | undefined> = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => `${values[key] ?? ""}`);
}

export function translateMessage(locale: Locale, descriptor?: MessageDescriptor) {
  if (!descriptor) {
    return "";
  }

  if (descriptor.raw) {
    return descriptor.raw;
  }

  const template = descriptor.key ? copyByLocale[locale].templates[descriptor.key] : undefined;
  return template ? formatTemplate(template, descriptor.values) : descriptor.key ?? "";
}

export function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function persistLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, locale);
}
