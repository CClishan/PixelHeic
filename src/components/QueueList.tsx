import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileImage,
  Layers,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import type { MetadataStatus, QueuedFile } from "@/app-types";
import type { Locale } from "@/lib/copy";
import { translateMessage } from "@/lib/copy";
import { formatDimensions, formatDuration, formatSavings, formatSize } from "@/lib/format";

interface QueueListProps {
  locale: Locale;
  title: string;
  queueCountLabel: string;
  emptyLabel: string;
  files: QueuedFile[];
  isProcessing: boolean;
  readyLabel: string;
  metadataLabels: Record<MetadataStatus, string>;
  downloadLabel: string;
  removeLabel: string;
  cancelLabel: string;
  clearLabel: string;
  onDownload: (file: QueuedFile) => void;
  onRemove: (file: QueuedFile) => void;
  onCancel: (file: QueuedFile) => void;
  onClearAll: () => void;
}

export function QueueList({
  locale,
  title,
  queueCountLabel,
  emptyLabel,
  files,
  isProcessing,
  readyLabel,
  metadataLabels,
  downloadLabel,
  removeLabel,
  cancelLabel,
  clearLabel,
  onDownload,
  onRemove,
  onCancel,
  onClearAll,
}: QueueListProps) {
  return (
    <section className="surface-card queue-shell">
      <div className="queue-header">
        <div className="queue-header__copy">
          <div className="queue-header__title-row">
            <span className="queue-header__icon">
              <Layers className="queue-header__icon-svg" />
            </span>
            <h2 className="queue-title">{title}</h2>
          </div>
        </div>
        <div className="queue-header__actions">
          <span className="queue-count-chip">{queueCountLabel}</span>
          <button type="button" className="queue-clear-button" onClick={onClearAll} disabled={!files.length || isProcessing}>
            {clearLabel}
          </button>
        </div>
      </div>

      <div className="queue-body">
        {files.length ? (
          files.map((file) => {
            const savings = formatSavings(file.size, file.convertedSize);
            const metadataLabel = file.metadataStatus ? metadataLabels[file.metadataStatus] : null;
            const detail = translateMessage(locale, file.detail);
            const warning = translateMessage(locale, file.warning);
            const error = translateMessage(locale, file.error);
            const duration = formatDuration(file.durationMs);
            const dims = formatDimensions(file.dimensions);
            const completedInfoMessages = [
              file.status === "completed" ? detail : "",
              !error && !warning ? file.metadataSummary ?? "" : "",
              warning,
            ].filter(Boolean);
            const showCollapsedCompletedInfo = file.status === "completed" && completedInfoMessages.length > 0;
            const inlineDetail = showCollapsedCompletedInfo ? "" : detail;
            const inlineMetadata = showCollapsedCompletedInfo ? "" : !error && !warning ? file.metadataSummary : "";

            return (
              <div key={file.id} className="queue-row group">
                <div className="queue-row__main">
                  <div className="queue-thumbnail">
                    {file.previewUrl ? (
                      <img src={file.previewUrl} alt={file.name} className="queue-thumbnail__image" />
                    ) : (
                      <FileImage className="queue-thumbnail__placeholder" />
                    )}
                  </div>

                  <div className="queue-copy">
                    <p className="queue-file-name">{file.name}</p>
                    <div className="queue-meta">
                      <span className="eyebrow-chip">{formatSize(file.size)}</span>
                      <span className="eyebrow-chip">{file.sourceFormat}</span>
                      {dims ? <span className="eyebrow-chip">{dims}</span> : null}
                      {file.targetFormat ? <span className="eyebrow-chip">{file.targetFormat.toUpperCase()}</span> : null}
                      {file.convertedSize ? <span className="eyebrow-chip eyebrow-chip--success">{formatSize(file.convertedSize)}</span> : null}
                      {typeof savings === "number" ? <span className="eyebrow-chip eyebrow-chip--success">-{savings}%</span> : null}
                      {duration ? <span className="eyebrow-chip">{duration}</span> : null}
                      {metadataLabel ? <span className="eyebrow-chip">{metadataLabel}</span> : null}
                    </div>
                    <div className="queue-feedback">
                      {inlineDetail ? <p className="queue-detail">{inlineDetail}</p> : null}
                      {inlineMetadata ? <p className="queue-note">{inlineMetadata}</p> : null}
                      {!showCollapsedCompletedInfo && warning ? <p className="queue-note queue-note--warning">{warning}</p> : null}
                      {error ? <p className="queue-note queue-note--error">{error}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="queue-actions">
                  <div className="queue-status-cluster">
                    {file.status === "pending" ? <span className="queue-status-pill">{readyLabel}</span> : null}
                    <span className="queue-state-icon">
                      {file.status === "preparing" || file.status === "processing" ? (
                        <Loader2 className="smooth-spin queue-state-icon__svg" />
                      ) : file.status === "completed" ? (
                        <CheckCircle2 className="queue-state-icon__svg queue-state-icon__svg--success" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="queue-state-icon__svg queue-state-icon__svg--error" />
                      ) : file.status === "cancelled" ? (
                        <AlertCircle className="queue-state-icon__svg queue-state-icon__svg--warning" />
                      ) : null}
                    </span>
                    {showCollapsedCompletedInfo ? (
                      <div className="queue-info-tooltip">
                        <span className="queue-info-tooltip__trigger" aria-hidden="true">
                          <AlertCircle className="queue-action-button__icon" />
                        </span>
                        <div className="queue-info-tooltip__bubble">
                          {completedInfoMessages.map((message) => (
                            <p key={message}>{message}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="queue-action-buttons">
                    {file.status === "completed" ? (
                      <button
                        type="button"
                        className="queue-action-button queue-action-button--download"
                        onClick={() => onDownload(file)}
                        aria-label={downloadLabel}
                      >
                        <Download className="queue-action-button__icon" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="queue-action-button"
                      onClick={() => (file.status === "processing" ? onCancel(file) : onRemove(file))}
                      aria-label={file.status === "processing" ? cancelLabel : removeLabel}
                    >
                      {file.status === "processing" ? (
                        <X className="queue-action-button__icon" />
                      ) : (
                        <Trash2 className="queue-action-button__icon" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="queue-empty-state">
            <div className="queue-empty-icon">
              <FileImage className="queue-empty-icon__svg" />
            </div>
            <p className="queue-empty-copy">{emptyLabel}</p>
          </div>
        )}
      </div>
    </section>
  );
}
