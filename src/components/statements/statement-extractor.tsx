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
  extractStatements,
  type StatementType,
} from "@/lib/api";
import { buildLedgerRows, type LedgerRow } from "@/lib/ledger";

export function StatementExtractor() {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [statementType, setStatementType] = useState<StatementType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const processFiles = async (options: BalanceOptions) => {
    if (files.length === 0) {
      toast.error("Add at least one PDF, Excel, or CSV file");
      return;
    }

    setProcessing(true);
    setRows([]);
    setStatementType(null);

    try {
      const result = await extractStatements(files);
      setStatementType(result.statement_type);

      const opening =
        options.source === "user" ? options.opening : result.opening_balance;
      const closing =
        options.source === "user" ? options.closing : result.closing_balance;

      setRows(
        buildLedgerRows({
          transactions: result.transactions,
          opening,
          closing,
        })
      );

      if (options.source === "system" && opening == null) {
        toast.error(
          "Could not find an opening balance on the statement. Enter it manually, or check the file."
        );
      } else {
        toast.success(
          `Extracted ${result.transactions.length} transaction${
            result.transactions.length === 1 ? "" : "s"
          }`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Statement Extractor
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload bank or credit card statements (PDF / Excel / CSV). Rows are
          parsed in code, then classified in one agent call.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload statements</CardTitle>
          <CardDescription>
            All files in a batch must be the same type (all bank or all credit
            card). Every file is parsed first, then sent together to the agent.
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
              {processing ? "Extracting…" : "Extract transactions"}
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
