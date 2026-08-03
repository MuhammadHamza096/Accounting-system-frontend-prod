"use client";

import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/lib/api";
import { downloadCsv, downloadExcel, downloadPdf } from "@/lib/download";

type Props = {
  transactions: Transaction[];
  disabled?: boolean;
};

export function DownloadMenu({ transactions, disabled }: Props) {
  const empty = transactions.length === 0;

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
        <DropdownMenuItem onClick={() => downloadExcel(transactions)}>
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadPdf(transactions)}>
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadCsv(transactions)}>
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
