"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  type StatementType,
  type Transaction,
} from "@/lib/api";

export function StatementExtractor() {
  const [files, setFiles] = useState<File[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statementType, setStatementType] = useState<StatementType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );

  const processFiles = async () => {
    if (files.length === 0) {
      toast.error("Add at least one PDF or Excel file");
      return;
    }

    setProcessing(true);
    setTransactions([]);
    setStatementType(null);
    setProgress({ current: 0, total: files.length });

    let expectedType: StatementType | undefined;
    const collected: Transaction[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          const result = await extractStatement(file, expectedType);
          expectedType = result.statement_type;
          setStatementType(result.statement_type);
          collected.push(...result.transactions);
          setTransactions([...collected]);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Extraction failed";
          toast.error(message);
          break;
        }
      }

      if (collected.length > 0) {
        toast.success(
          `Extracted ${collected.length} transaction${collected.length === 1 ? "" : "s"}`
        );
      }
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
          Upload bank or credit card statements (PDF / Excel). Files are processed
          one by one with GPT and shown in a single table.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload statements</CardTitle>
          <CardDescription>
            All files in a batch must be the same type (all bank or all credit
            card).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone
            files={files}
            onChange={setFiles}
            disabled={processing}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={processFiles} disabled={processing || files.length === 0}>
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
                  setTransactions([]);
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
              {transactions.length > 0 && (
                <Badge variant="outline">{transactions.length} rows</Badge>
              )}
            </div>
            <CardDescription>
              Withdrawals show as (amount). Deposits show without brackets.
            </CardDescription>
          </div>
          <DownloadMenu transactions={transactions} disabled={processing} />
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
