"use client";

import { FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = ".pdf,.xlsx,.xls,.csv";
const ACCEPTED_EXT = new Set([".pdf", ".xlsx", ".xls", ".csv"]);
export const MAX_FILES = 25;
export const MAX_FILE_SIZE_MB = 10;

function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function isAllowed(file: File) {
  return ACCEPTED_EXT.has(extensionOf(file.name));
}

type FileDropzoneProps = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
};

export function FileDropzone({ files, onChange, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const mergeFiles = useCallback(
    (incoming: FileList | File[]) => {
      const next = [...files];
      const errors: string[] = [];

      for (const file of Array.from(incoming)) {
        if (!isAllowed(file)) {
          errors.push(`${file.name}: only PDF, Excel, and CSV are allowed`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          errors.push(`${file.name}: exceeds ${MAX_FILE_SIZE_MB}MB`);
          continue;
        }
        if (next.some((f) => f.name === file.name && f.size === file.size)) {
          continue;
        }
        if (next.length >= MAX_FILES) {
          errors.push(`Maximum ${MAX_FILES} files allowed`);
          break;
        }
        next.push(file);
      }

      onChange(next);
      for (const message of errors) {
        toast.error(message);
      }
    },
    [files, onChange]
  );

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    mergeFiles(event.dataTransfer.files);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-primary bg-accent/60"
            : "border-border bg-muted/30 hover:bg-muted/50",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <div className="bg-background flex size-12 items-center justify-center rounded-full border shadow-xs">
          <Upload className="text-muted-foreground size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Drag & drop PDF, Excel, or CSV statements here
          </p>
          <p className="text-muted-foreground text-xs">
            Or click to browse · up to {MAX_FILES} files · {MAX_FILE_SIZE_MB}MB
            each · .pdf .xlsx .xls .csv
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) mergeFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-border max-h-56 overflow-y-auto rounded-lg border">
          {files.map((file, index) => {
            const ext = extensionOf(file.name);
            const Icon = ext === ".pdf" ? FileText : FileSpreadsheet;
            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(index);
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
