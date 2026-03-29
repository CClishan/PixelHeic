import { useRef, useState } from "react";
import { Plus } from "lucide-react";

interface FileDropzoneProps {
  title: string;
  subtitle: string;
  hint: string;
  accept: string;
  compactTitle: string;
  compactHint: string;
  compact?: boolean;
  onFiles: (files: FileList) => void;
}

export function FileDropzone({
  title,
  subtitle,
  hint,
  accept,
  compactTitle,
  compactHint,
  compact = false,
  onFiles,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    onFiles(files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section
      aria-label={title}
      className={`dropzone-surface ${compact ? "dropzone-surface--compact" : ""} ${dragging ? "dropzone-surface--active" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return;
        }
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accept}
        multiple
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="dropzone-grid" />
      <div className={`dropzone-content ${compact ? "dropzone-content--compact" : ""}`}>
        <div className="dropzone-orb">
          <Plus className="dropzone-orb__icon" />
        </div>
        <div className="dropzone-copy-group">
          <p className="dropzone-title">{compact ? compactTitle : title}</p>
          {!compact ? <p className="dropzone-copy">{subtitle}</p> : null}
        </div>
        <p className={`dropzone-hint ${compact ? "dropzone-hint--compact" : ""}`}>{compact ? compactHint : hint}</p>
      </div>
    </section>
  );
}
