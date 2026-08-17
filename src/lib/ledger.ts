import type { ExtractResponse, Transaction } from "@/lib/api";
import { parseDate } from "@/lib/dates";

export type LedgerKind = "opening" | "transaction" | "closing";

export type LedgerRow = Transaction & {
  kind: LedgerKind;
  running_balance: number | null;
};

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return transactions
    .map((row, index) => ({ row, index, date: parseDate(row.date) }))
    .sort((a, b) => {
      if (a.date && b.date) {
        const diff = a.date.getTime() - b.date.getTime();
        if (diff !== 0) return diff;
        return a.index - b.index;
      }
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return a.index - b.index;
    })
    .map((item) => item.row);
}

export function pickExtractedBalances(results: ExtractResponse[]): {
  opening: number | null;
  closing: number | null;
} {
  if (results.length === 0) {
    return { opening: null, closing: null };
  }

  const dated = results.map((result) => {
    const times = result.transactions
      .map((row) => parseDate(row.date))
      .filter((date): date is Date => date != null)
      .map((date) => date.getTime());
    return {
      result,
      min: times.length ? Math.min(...times) : Number.POSITIVE_INFINITY,
      max: times.length ? Math.max(...times) : Number.NEGATIVE_INFINITY,
    };
  });

  const oldest = [...dated].sort((a, b) => a.min - b.min)[0];
  const newest = [...dated].sort((a, b) => b.max - a.max)[0];

  return {
    opening: oldest?.result.opening_balance ?? null,
    closing: newest?.result.closing_balance ?? null,
  };
}

export function buildLedgerRows(options: {
  transactions: Transaction[];
  opening: number | null;
  closing: number | null;
}): LedgerRow[] {
  const sorted = sortTransactions(options.transactions);
  const firstDate = sorted[0]?.date ?? "";
  const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : "";
  const rows: LedgerRow[] = [];
  let running = options.opening ?? 0;

  if (options.opening != null) {
    rows.push({
      date: firstDate,
      description: "Opening Balance",
      deposit: null,
      withdrawal: null,
      source_file: "",
      kind: "opening",
      running_balance: options.opening,
    });
  }

  for (const txn of sorted) {
    running = running - (txn.withdrawal ?? 0) + (txn.deposit ?? 0);
    rows.push({
      ...txn,
      kind: "transaction",
      running_balance: running,
    });
  }

  if (options.closing != null) {
    rows.push({
      date: lastDate,
      description: "Closing Balance",
      deposit: null,
      withdrawal: null,
      source_file: "",
      kind: "closing",
      running_balance: options.closing,
    });
  }

  return rows;
}
