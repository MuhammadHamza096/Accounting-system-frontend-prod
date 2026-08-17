"use client";

import type { LedgerRow } from "@/lib/ledger";
import { formatAmount, formatMoney, formatSignedAmount } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  rows: LedgerRow[];
};

export function TransactionsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Extracted transactions will appear here.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Deposit</TableHead>
          <TableHead className="text-right">Withdrawal</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const bookend = row.kind === "opening" || row.kind === "closing";
          return (
            <TableRow key={`${row.kind}-${row.source_file}-${row.date}-${index}`}>
              <TableCell className="text-muted-foreground max-w-[160px] truncate">
                {row.source_file}
              </TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell className="max-w-[280px] truncate whitespace-normal">
                {row.description}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.deposit != null ? formatMoney(row.deposit) : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.withdrawal != null ? formatMoney(row.withdrawal) : ""}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {bookend ? "" : formatAmount(row.deposit, row.withdrawal)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatSignedAmount(row.running_balance)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
