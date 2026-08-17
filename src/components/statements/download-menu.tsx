"use client";

import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsv, downloadExcel, downloadPdf } from "@/lib/download";
import type { LedgerRow } from "@/lib/ledger";

type Props = {
  rows: LedgerRow[];
  disabled?: boolean;
};

export function DownloadMenu({ rows, disabled }: Props) {
  const empty = rows.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || empty}>
          <Download className="size-4" />
          Download
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadExcel(rows)}>
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadPdf(rows)}>
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadCsv(rows)}>
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
