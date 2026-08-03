"use client";

import type { Transaction } from "@/lib/api";
import { formatAmount, formatMoney } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  transactions: Transaction[];
};

export function TransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
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
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Deposit</TableHead>
          <TableHead className="text-right">Withdrawal</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((row, index) => (
          <TableRow key={`${row.source_file}-${row.date}-${index}`}>
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
              {formatAmount(row.deposit, row.withdrawal)}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-[160px] truncate">
              {row.source_file}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
