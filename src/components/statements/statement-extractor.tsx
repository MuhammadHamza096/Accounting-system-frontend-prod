"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  BalanceOptionsDialog,
  type BalanceOptions,
} from "@/components/statements/balance-options-dialog";
import { DownloadMenu } from "@/components/statements/download-menu";
import { FileDropzone } from "@/components/statements/file-dropzone";
import { TransactionsTable } from "@/components/statements/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  extractStatement,
  type ExtractResponse,
  type StatementType,
  type Transaction,
} from "@/lib/api";
import { buildLedgerRows, pickExtractedBalances, type LedgerRow } from "@/lib/ledger";

/** Process files in fixed batches of 3 (wait for each batch to finish). */
const BATCH_SIZE = 3;

async function runBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

export function StatementExtractor() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [statementType, setStatementType] = useState<StatementType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const applyLedger = (
    collected: Transaction[],
    extracts: ExtractResponse[],
    options: BalanceOptions
  ) => {
    const extracted = pickExtractedBalances(extracts);
    const opening = options.source === "user" ? options.opening : extracted.opening;
    const closing = options.source === "user" ? options.closing : extracted.closing;
    setRows(buildLedgerRows({ transactions: collected, opening, closing }));
    return { opening, closing };
  };

  const processFiles = async (options: BalanceOptions) => {
    if (files.length === 0) {
      toast.error("Add at least one PDF or Excel file");
      return;
    }

    setProcessing(true);
    setRows([]);
    setStatementType(null);
    setProgress({ current: 0, total: files.length });

    const collected: Transaction[] = [];
    const extracts: ExtractResponse[] = [];
    let completed = 0;
    let lockedType: StatementType | undefined;
    let failed = false;

    try {
      const first = await extractStatement(files[0]);
      lockedType = first.statement_type;
      setStatementType(first.statement_type);
      collected.push(...first.transactions);
      extracts.push(first);
      applyLedger(collected, extracts, options);
      completed = 1;
      setProgress({ current: completed, total: files.length });

      const rest = files.slice(1);
      if (rest.length === 0) {
        const { opening } = applyLedger(collected, extracts, options);
        if (options.source === "system" && opening == null) {
          toast.error(
            "Could not find an opening balance on the statement. Enter it manually, or check the file."
          );
        } else {
          toast.success(
            `Extracted ${collected.length} transaction${collected.length === 1 ? "" : "s"}`
          );
        }
        return;
      }

      await runBatches(rest, BATCH_SIZE, async (file) => {
        if (failed) {
          return;
        }
        try {
          const result = await extractStatement(file, lockedType);
          collected.push(...result.transactions);
          extracts.push(result);
          applyLedger(collected, extracts, options);
        } catch (err) {
          failed = true;
          const message = err instanceof Error ? err.message : "Extraction failed";
          toast.error(message);
          throw err;
        } finally {
          completed += 1;
          setProgress({ current: Math.min(completed, files.length), total: files.length });
        }
      }).catch(() => {
        // Error already toasted above.
      });

      if (!failed && collected.length > 0) {
        const { opening } = applyLedger(collected, extracts, options);
        if (options.source === "system" && opening == null) {
          toast.error(
            "Could not find an opening balance on the statement. Enter it manually, or check the file."
          );
        } else {
          toast.success(
            `Extracted ${collected.length} transaction${collected.length === 1 ? "" : "s"}`
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      toast.error(message);
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Statement Extractor
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload bank or credit card statements (PDF / Excel). Files are
          extracted in batches of {BATCH_SIZE} and merged into one table.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload statements</CardTitle>
          <CardDescription>
            All files in a batch must be the same type (all bank or all credit
            card). Extraction runs {BATCH_SIZE} files at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone
            files={files}
            onChange={setFiles}
            disabled={processing}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={processing || files.length === 0}
            >
              {processing && <Loader2 className="size-4 animate-spin" />}
              {processing
                ? `Processing ${progress?.current ?? 0}/${progress?.total ?? 0}…`
                : "Extract transactions"}
            </Button>
            {files.length > 0 && !processing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFiles([]);
                  setRows([]);
                  setStatementType(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Transactions</CardTitle>
              {statementType && (
                <Badge variant="secondary">
                  {statementType === "bank" ? "Bank" : "Credit card"}
                </Badge>
              )}
              {rows.length > 0 && (
                <Badge variant="outline">{rows.length} rows</Badge>
              )}
            </div>
            <CardDescription>
              Rows are sorted by date. Balance is opening − withdrawals + deposits.
              Negatives show in parentheses, e.g. (6,553.00).
            </CardDescription>
          </div>
          <DownloadMenu rows={rows} disabled={processing} />
        </CardHeader>
        <CardContent>
          <TransactionsTable rows={rows} />
        </CardContent>
      </Card>

      <BalanceOptionsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={(options) => {
          setDialogOpen(false);
          void processFiles(options);
        }}
      />
    </div>
  );
}
