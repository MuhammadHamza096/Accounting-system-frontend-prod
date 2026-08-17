import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { formatAmount, formatMoney, formatSignedAmount } from "@/lib/format";
import type { LedgerRow } from "@/lib/ledger";

function toRows(rows: LedgerRow[]) {
  return rows.map((row) => ({
    Source: row.source_file,
    Date: row.date,
    Description: row.description,
    Deposit: row.deposit != null ? formatMoney(row.deposit) : "",
    Withdrawal: row.withdrawal != null ? formatMoney(row.withdrawal) : "",
    Amount:
      row.kind === "opening" || row.kind === "closing"
        ? ""
        : formatAmount(row.deposit, row.withdrawal),
    Balance: formatSignedAmount(row.running_balance),
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

export function downloadCsv(rows: LedgerRow[], filename = "statements.csv") {
  const data = toRows(rows);
  const headers = [
    "Source",
    "Date",
    "Description",
    "Deposit",
    "Withdrawal",
    "Amount",
    "Balance",
  ];
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => escape(String(row[h as keyof typeof row] ?? ""))).join(",")
    ),
  ];
  downloadBlob(filename, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

export function downloadExcel(rows: LedgerRow[], filename = "statements.xlsx") {
  const data = toRows(rows);
  const sheet = XLSX.utils.json_to_sheet(data);
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

export function downloadPdf(rows: LedgerRow[], filename = "statements.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Statement Transactions", 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [
      ["Source", "Date", "Description", "Deposit", "Withdrawal", "Amount", "Balance"],
    ],
    body: rows.map((row) => [
      row.source_file,
      row.date,
      row.description,
      row.deposit != null ? formatMoney(row.deposit) : "",
      row.withdrawal != null ? formatMoney(row.withdrawal) : "",
      row.kind === "opening" || row.kind === "closing"
        ? ""
        : formatAmount(row.deposit, row.withdrawal),
      formatSignedAmount(row.running_balance),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [33, 33, 33] },
  });

  doc.save(filename);
}
