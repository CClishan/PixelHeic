import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Download, Settings2 } from "lucide-react";
import type { HeicConversionSettings, HeicMetadata, MetadataStatus, QueuedFile, ToastState } from "@/app-types";
import { FileDropzone } from "@/components/FileDropzone";
import { QueueList } from "@/components/QueueList";
import { ToastRegion } from "@/components/ToastRegion";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import {
  formatTemplate,
  getCopy,
  getInitialLocale,
  message,
  persistLocale,
  rawMessage,
  type Locale,
  type MessageDescriptor,
} from "@/lib/copy";
import { extractHeicMetadata, hasMeaningfulMetadata } from "@/lib/exif";
import { convertHeicFile, prepareHeicFile } from "@/lib/heic";
import { formatDate, formatTimestamp, sanitizeFileName } from "@/lib/format";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const LARGE_FILE_WARNING = 12 * 1024 * 1024;
const HEIC_ACCEPT = ".heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDefaultSettings(): HeicConversionSettings {
  return {
    outputFormat: "jpg",
    jpegQuality: 86,
    webpQuality: 82,
    metadataPolicy: "keep",
  };
}

function toMessageDescriptor(input: MessageDescriptor | string) {
  return typeof input === "string" ? rawMessage(input) : input;
}

function isLikelyHeic(file: File) {
  return (
    /\.(heic|heif)$/i.test(file.name) ||
    ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(file.type)
  );
}

function getSourceFormat(file: File): QueuedFile["sourceFormat"] {
  return /\.heif$/i.test(file.name) || file.type.includes("heif") ? "HEIF" : "HEIC";
}

function createQueuedFile(file: File): QueuedFile {
  return {
    id: createId(),
    workspace: "heic",
    name: file.name,
    size: file.size,
    sourceFormat: getSourceFormat(file),
    originalFile: file,
    status: "preparing",
    detail: message("validatingHeic"),
  };
}

function optionClass(active: boolean) {
  return `toggle-button ${active ? "toggle-button--active" : ""}`;
}

function languageButtonClass(active: boolean) {
  return `locale-button ${active ? "locale-button--active" : ""}`;
}

function tabButtonClass(active: boolean) {
  return `workspace-tab ${active ? "workspace-tab--active" : ""}`;
}

function rangeBackground(value: number, min: number, max: number) {
  const percentage = `${((value - min) / (max - min)) * 100}%`;
  return {
    background: `linear-gradient(90deg, rgba(23,23,23,0.92) 0 ${percentage}, rgba(232,232,232,1) ${percentage} 100%)`,
  };
}

function outputLabel(locale: Locale, format: HeicConversionSettings["outputFormat"]) {
  switch (format) {
    case "jpg":
      return "JPG";
    case "png":
      return "PNG";
    case "webp":
      return "WEBP";
  }
}

function metadataSummary(locale: Locale, metadata?: HeicMetadata) {
  if (!metadata || !hasMeaningfulMetadata(metadata)) {
    return "";
  }

  const pieces = [
    formatDate(locale, metadata.capturedAt),
    [metadata.make, metadata.model].filter(Boolean).join(" ").trim() || null,
    typeof metadata.latitude === "number" && typeof metadata.longitude === "number" ? "GPS" : null,
  ].filter(Boolean);

  return pieces.join(" · ");
}

function completionMessage(
  settings: HeicConversionSettings,
  metadataStatus: MetadataStatus,
  format: string,
) {
  if (settings.metadataPolicy === "strip") {
    return message("metadataRemoved");
  }

  if (metadataStatus === "available") {
    return message("keptMetadataJpg");
  }

  if (metadataStatus === "limited") {
    return message("metadataLimitedPngWebp");
  }

  if (metadataStatus === "none" && settings.metadataPolicy === "keep") {
    return message("metadataMissing");
  }

  return message("convertedToFormat", { format });
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [settings, setSettings] = useState<HeicConversionSettings>(createDefaultSettings);
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const filesRef = useRef(files);
  const configPanelRef = useRef<HTMLElement | null>(null);
  const controllersRef = useRef<Record<string, AbortController>>({});
  const sessionStampRef = useRef(formatTimestamp());
  const copy = useMemo(() => getCopy(locale), [locale]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    document.body.dataset.language = locale;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    persistLocale(locale);
  }, [locale]);

  useEffect(() => {
    setFiles((current) =>
      current.map((file) => ({
        ...file,
        metadataSummary: metadataSummary(locale, file.metadata),
      })),
    );
  }, [locale]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const completedFiles = useMemo(
    () => files.filter((file) => file.status === "completed" && file.resultBlob && file.outputName),
    [files],
  );

  function showToast(input: MessageDescriptor | string, tone: ToastState["tone"] = "info") {
    setToast({
      id: createId(),
      message: toMessageDescriptor(input),
      tone,
    });
  }

  function updateFile(id: string, patch: Partial<QueuedFile> | ((file: QueuedFile) => Partial<QueuedFile>)) {
    setFiles((current) =>
      current.map((file) => {
        if (file.id !== id) {
          return file;
        }

        const resolvedPatch = typeof patch === "function" ? patch(file) : patch;
        if (resolvedPatch.previewUrl && file.previewUrl && resolvedPatch.previewUrl !== file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }

        return {
          ...file,
          ...resolvedPatch,
        };
      }),
    );
  }

  function removeFile(file: QueuedFile) {
    controllersRef.current[file.id]?.abort(new Error("Cancelled by user."));
    delete controllersRef.current[file.id];

    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    setFiles((current) => current.filter((entry) => entry.id !== file.id));
  }

  function clearWorkspace() {
    Object.values(controllersRef.current).forEach((controller) => controller.abort(new Error("Cleared workspace.")));
    controllersRef.current = {};
    filesRef.current.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setFiles([]);
    setIsProcessing(false);
    showToast(message("queueCleared"));
  }

  async function prepareQueuedItem(queuedFile: QueuedFile) {
    updateFile(queuedFile.id, {
      status: "preparing",
      detail: message("preparingPreview"),
      error: undefined,
      warning: undefined,
    });

    try {
      const metadata = await extractHeicMetadata(queuedFile.originalFile).catch(() => undefined);
      const prepared = await prepareHeicFile(queuedFile.originalFile, metadata);
      const stillExists = filesRef.current.some((file) => file.id === queuedFile.id);

      if (!stillExists) {
        if (prepared.previewUrl) {
          URL.revokeObjectURL(prepared.previewUrl);
        }
        return;
      }

      if (!prepared.isHeic) {
        updateFile(queuedFile.id, {
          status: "error",
          detail: message("conversionFailed"),
          error: message("unsupportedHeicContent", { name: queuedFile.name }),
          metadata,
          metadataSummary: metadataSummary(locale, metadata),
          metadataStatus: hasMeaningfulMetadata(metadata) ? "available" : "none",
        });
        return;
      }

      updateFile(queuedFile.id, {
        status: "pending",
        detail: message("readyForConversion"),
        warning: prepared.previewUrl ? undefined : message("previewFailed"),
        previewUrl: prepared.previewUrl,
        dimensions: prepared.dimensions,
        metadata,
        metadataSummary: metadataSummary(locale, metadata),
        metadataStatus: hasMeaningfulMetadata(metadata) ? "available" : "none",
      });
    } catch (error) {
      updateFile(queuedFile.id, {
        status: "error",
        detail: message("conversionFailed"),
        error: rawMessage(error instanceof Error ? error.message : copy.templates.conversionFailed),
      });
    }
  }

  function handleFiles(uploadedFiles: FileList) {
    const queue: QueuedFile[] = [];

    Array.from(uploadedFiles).forEach((file) => {
      if (!isLikelyHeic(file)) {
        showToast(message("unsupportedFileType", { name: file.name }), "error");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showToast(message("fileTooLarge", { name: file.name, maxMb: 50 }), "error");
        return;
      }

      if (file.size >= LARGE_FILE_WARNING) {
        showToast(message("largeFileWarning", { name: file.name }));
      }

      queue.push(createQueuedFile(file));
    });

    if (!queue.length) {
      return;
    }

    setFiles((current) => [...current, ...queue]);
    queue.forEach((queuedFile) => {
      void prepareQueuedItem(queuedFile);
    });
  }

  async function convertQueue() {
    const candidates = filesRef.current.filter((file) => !["preparing", "processing"].includes(file.status));

    if (!candidates.length) {
      showToast(message("noFilesToConvert"), "error");
      return;
    }

    setIsProcessing(true);

    try {
      for (const queuedFile of candidates) {
        if (!filesRef.current.some((file) => file.id === queuedFile.id)) {
          continue;
        }

        const controller = new AbortController();
        controllersRef.current[queuedFile.id] = controller;
        const targetLabel = outputLabel(locale, settings.outputFormat);

        updateFile(queuedFile.id, {
          status: "processing",
          detail: message("decodingHeic"),
          error: undefined,
          warning: undefined,
          targetFormat: settings.outputFormat,
          resultBlob: undefined,
          outputName: undefined,
          outputType: undefined,
          convertedSize: undefined,
          durationMs: undefined,
        });

        try {
          const result = await convertHeicFile(
            queuedFile.originalFile,
            settings,
            queuedFile.metadata,
            controller.signal,
            (stage) => {
              if (stage === "decode") {
                updateFile(queuedFile.id, { detail: message("decodingHeic") });
              } else if (stage === "encode") {
                updateFile(queuedFile.id, { detail: message("encodingOutput", { format: targetLabel }) });
              } else {
                updateFile(queuedFile.id, { detail: message("restoringMetadata") });
              }
            },
          );

          updateFile(queuedFile.id, (current) => ({
            status: "completed",
            resultBlob: result.file,
            outputName: result.file.name,
            outputType: result.file.type,
            convertedSize: result.file.size,
            durationMs: result.durationMs,
            targetFormat: settings.outputFormat,
            dimensions: result.dimensions,
            metadataStatus: result.metadataStatus,
            metadataSummary: metadataSummary(locale, current.metadata),
            detail: completionMessage(settings, result.metadataStatus, targetLabel),
            warning: result.warning ? message(result.warning) : undefined,
            error: undefined,
          }));
        } catch (error) {
          if (controller.signal.aborted) {
            updateFile(queuedFile.id, {
              status: "cancelled",
              detail: message("conversionCancelled"),
            });
          } else {
            updateFile(queuedFile.id, {
              status: "error",
              detail: message("conversionFailed"),
              error: rawMessage(error instanceof Error ? error.message : copy.templates.conversionFailed),
            });
            showToast(rawMessage(error instanceof Error ? error.message : copy.templates.conversionFailed), "error");
          }
        } finally {
          delete controllersRef.current[queuedFile.id];
        }
      }

      if (filesRef.current.some((file) => file.status === "completed")) {
        showToast(message("conversionFinished"), "success");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function cancelFile(file: QueuedFile) {
    const controller = controllersRef.current[file.id];
    if (!controller) {
      return;
    }

    controller.abort(new Error("Cancelled by user."));
    delete controllersRef.current[file.id];
    updateFile(file.id, {
      status: "cancelled",
      detail: message("conversionCancelled"),
    });
    showToast(message("conversionCancelled"));
  }

  function downloadSingle(file: QueuedFile) {
    if (!file.resultBlob || !file.outputName) {
      showToast(message("noDownloadsReady"), "error");
      return;
    }

    const url = URL.createObjectURL(file.resultBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.outputName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast(message("downloadReady", { name: file.outputName }), "success");
  }

  async function downloadZip() {
    if (!completedFiles.length) {
      showToast(message("noDownloadsReady"), "error");
      return;
    }

    if (completedFiles.length === 1) {
      downloadSingle(completedFiles[0]);
      return;
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    completedFiles.forEach((file) => {
      zip.file(sanitizeFileName(file.outputName ?? file.name), file.resultBlob!);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const outputName = `pixelheic-${sessionStampRef.current}.zip`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = outputName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast(message("preparedZip", { count: completedFiles.length, name: outputName }), "success");
  }

  function jumpToSettings() {
    configPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const metadataLabels: Record<MetadataStatus, string> = {
    available: copy.status.metadataAvailable,
    limited: copy.status.metadataLimited,
    stripped: copy.status.metadataStripped,
    none: copy.status.metadataNone,
  };

  const outputCardBody = formatTemplate(copy.templates.outputSummary, {
    format: outputLabel(locale, settings.outputFormat),
    count: completedFiles.length,
  });

  const metadataCardBody =
    settings.metadataPolicy === "strip"
      ? copy.templates.metadataStripSummary
      : settings.outputFormat === "jpg"
        ? copy.templates.metadataKeepSummary
        : copy.templates.metadataLimitedSummary;

  const metadataNotice =
    settings.metadataPolicy === "strip"
      ? copy.settings.metadataNoticeStrip
      : settings.outputFormat === "jpg"
        ? copy.settings.metadataNoticeKeepJpg
        : copy.settings.metadataNoticeKeepLimited;

  return (
    <div className="app-frame">
      <ToastRegion locale={locale} closeLabel={copy.closeToastLabel} toast={toast} onClose={() => setToast(null)} />

      <div className="page-shell">
        <main className="workspace-grid">
          <section className="workspace-main">
            <header className="page-header">
              <div className="page-header__brand">
                <h1 className="page-header__title">{copy.siteTitle}</h1>
              </div>

              <div className="page-header__controls">
                <div className="page-header__tabs">
                  <WorkspaceTabs activeLabel={copy.currentWorkspace} getButtonClassName={tabButtonClass} />
                </div>

                <div className="page-header__locale" role="group" aria-label={copy.workspaceLabel}>
                  <button type="button" className={languageButtonClass(locale === "en")} onClick={() => setLocale("en")}>
                    {copy.languageOptionEnglish}
                  </button>
                  <button type="button" className={languageButtonClass(locale === "zh")} onClick={() => setLocale("zh")}>
                    {copy.languageOptionChinese}
                  </button>
                </div>
              </div>
            </header>

            <FileDropzone
              title={copy.dropzone.title}
              subtitle={copy.dropzone.subtitle}
              hint={copy.dropzone.hint}
              accept={HEIC_ACCEPT}
              compactTitle={copy.dropzone.compactTitle}
              compactHint={copy.dropzone.compactHint}
              compact={files.length > 0}
              onFiles={handleFiles}
            />

            <section className="upload-guide">
              <div className="upload-guide__grid upload-guide__grid--four">
                <article className="upload-guide__item">
                  <p className="section-kicker">{copy.cards.local}</p>
                  <p className="upload-guide__body upload-guide__body--tag">{copy.templates.localSummary}</p>
                  <p className="upload-guide__meta-note">{copy.settings.localNoticeTitle}</p>
                </article>

                <article className="upload-guide__item">
                  <p className="section-kicker">{copy.cards.output}</p>
                  <p className="upload-guide__body upload-guide__body--tag">{outputCardBody}</p>
                  <p className="upload-guide__meta-note">
                    {completedFiles.length ? `${completedFiles.length} / ${files.length || 0}` : copy.empty.downloads}
                  </p>
                </article>

                <article className="upload-guide__item">
                  <p className="section-kicker">{copy.cards.metadata}</p>
                  <p className="upload-guide__body upload-guide__body--tag">{metadataCardBody}</p>
                  <p className="upload-guide__meta-note">{copy.templates.singleFrameNotice}</p>
                </article>
              </div>
            </section>

            <QueueList
              locale={locale}
              title={copy.queueTitle}
              queueCountLabel={formatTemplate(copy.templates.queueCount, { count: files.length })}
              emptyLabel={copy.empty.queue}
              files={files}
              isProcessing={isProcessing}
              readyLabel={copy.status.ready}
              metadataLabels={metadataLabels}
              downloadLabel={copy.actions.download}
              removeLabel={copy.actions.remove}
              cancelLabel={copy.actions.cancel}
              clearLabel={copy.actions.clear}
              onDownload={downloadSingle}
              onRemove={removeFile}
              onCancel={cancelFile}
              onClearAll={clearWorkspace}
            />
          </section>

          <aside className="workspace-aside" ref={configPanelRef}>
            <header className="config-header">
              <p className="config-header__title">
                <Settings2 className="config-header__icon" />
                {copy.configurationTitle}
              </p>
            </header>

            <section className="surface-card config-panel">
              <div className="control-group">
                <p className="control-label">{copy.settings.outputFormat}</p>
                <div className="toggle-surface toggle-surface--triple">
                  {(["jpg", "png", "webp"] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      className={optionClass(settings.outputFormat === format)}
                      onClick={() => setSettings((current) => ({ ...current, outputFormat: format }))}
                    >
                      {outputLabel(locale, format)}
                    </button>
                  ))}
                </div>
              </div>

              {settings.outputFormat === "jpg" ? (
                <div className="control-group">
                  <div className="control-heading">
                    <p className="control-label">{copy.settings.jpegQuality}</p>
                    <span className="control-value">{settings.jpegQuality}</span>
                  </div>
                  <input
                    className="range-input"
                    type="range"
                    min={40}
                    max={96}
                    step={1}
                    value={settings.jpegQuality}
                    style={rangeBackground(settings.jpegQuality, 40, 96)}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, jpegQuality: Number(event.target.value) }))
                    }
                  />
                </div>
              ) : null}

              {settings.outputFormat === "webp" ? (
                <div className="control-group">
                  <div className="control-heading">
                    <p className="control-label">{copy.settings.webpQuality}</p>
                    <span className="control-value">{settings.webpQuality}</span>
                  </div>
                  <input
                    className="range-input"
                    type="range"
                    min={40}
                    max={96}
                    step={1}
                    value={settings.webpQuality}
                    style={rangeBackground(settings.webpQuality, 40, 96)}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, webpQuality: Number(event.target.value) }))
                    }
                  />
                </div>
              ) : null}

              <div className="control-group">
                <p className="control-label">{copy.settings.metadataPolicy}</p>
                <div className="toggle-surface">
                  <button
                    type="button"
                    className={optionClass(settings.metadataPolicy === "keep")}
                    onClick={() => setSettings((current) => ({ ...current, metadataPolicy: "keep" }))}
                  >
                    {copy.settings.keepMetadata}
                  </button>
                  <button
                    type="button"
                    className={optionClass(settings.metadataPolicy === "strip")}
                    onClick={() => setSettings((current) => ({ ...current, metadataPolicy: "strip" }))}
                  >
                    {copy.settings.stripMetadata}
                  </button>
                </div>
              </div>

              <div className="notice-panel">
                <p className="notice-panel__label">{copy.settings.localNoticeTitle}</p>
                <p className="notice-panel__body">{copy.settings.localNoticeBody}</p>
              </div>

              <div className="notice-panel">
                <p className="notice-panel__label">{copy.settings.metadataNoticeTitle}</p>
                <p className="notice-panel__body">{metadataNotice}</p>
              </div>

              <div className="action-stack">
                <button type="button" className="primary-button" onClick={() => void convertQueue()} disabled={!files.length || isProcessing}>
                  <Archive className="button-icon" />
                  <span>{isProcessing ? copy.actions.converting : copy.actions.convert}</span>
                </button>

                <button type="button" className="secondary-button" onClick={() => void downloadZip()} disabled={!completedFiles.length}>
                  <Download className="button-icon" />
                  <span>{copy.actions.downloadZip}</span>
                </button>

                <button type="button" className="ghost-button" onClick={clearWorkspace} disabled={!files.length}>
                  <span>{copy.actions.clear}</span>
                </button>
              </div>
            </section>

            <section className="surface-card credits-panel">
              <p className="credits-panel__label">{copy.credits.title}</p>
              <p className="credits-panel__body">{copy.credits.body}</p>
              <div className="credits-panel__chips">
                {copy.credits.chips.map((chip) => (
                  <span key={chip} className="credits-chip">
                    {chip}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </main>
      </div>

      <div className={`mobile-fab-bar ${completedFiles.length ? "mobile-fab-bar--with-download" : ""}`}>
        <button type="button" className="mobile-fab-bar__settings" onClick={jumpToSettings}>
          <Settings2 className="button-icon" />
          <span>{copy.actions.jumpToSettings}</span>
        </button>
        {completedFiles.length ? (
          <button type="button" className="mobile-fab-bar__secondary" onClick={() => void downloadZip()}>
            <Download className="button-icon" />
            <span>{copy.actions.downloadZip}</span>
          </button>
        ) : null}
        <button type="button" className="mobile-fab-bar__primary" onClick={() => void convertQueue()} disabled={!files.length || isProcessing}>
          <Archive className="button-icon" />
          <span>{isProcessing ? copy.actions.converting : copy.actions.convert}</span>
        </button>
      </div>
    </div>
  );
}
