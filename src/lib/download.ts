import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { Transaction } from "@/lib/api";
import { formatAmount, formatMoney } from "@/lib/format";

function toRows(transactions: Transaction[]) {
  return transactions.map((t) => ({
    Date: t.date,
    Description: t.description,
    Deposit: t.deposit != null ? formatMoney(t.deposit) : "",
    Withdrawal: t.withdrawal != null ? formatMoney(t.withdrawal) : "",
    Amount: formatAmount(t.deposit, t.withdrawal),
    Source: t.source_file,
  }));
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(transactions: Transaction[], filename = "statements.csv") {
  const rows = toRows(transactions);
  const headers = ["Date", "Description", "Deposit", "Withdrawal", "Amount", "Source"];
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escape(String(row[h as keyof typeof row] ?? ""))).join(",")
    ),
  ];
  downloadBlob(filename, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

export function downloadExcel(transactions: Transaction[], filename = "statements.xlsx") {
  const rows = toRows(transactions);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Transactions");
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  downloadBlob(
    filename,
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
}

export function downloadPdf(transactions: Transaction[], filename = "statements.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Statement Transactions", 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [["Date", "Description", "Deposit", "Withdrawal", "Amount", "Source"]],
    body: transactions.map((t) => [
      t.date,
      t.description,
      t.deposit != null ? formatMoney(t.deposit) : "",
      t.withdrawal != null ? formatMoney(t.withdrawal) : "",
      formatAmount(t.deposit, t.withdrawal),
      t.source_file,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [33, 33, 33] },
  });

  doc.save(filename);
}
