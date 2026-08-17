/** Accepts 1200, -6553, (6553), 6,553.00, (6,553.00). */
export function parseAmountInput(raw: string): number | null {
  let text = raw.trim();
  if (!text) return null;

  let negative = false;
  if (text.startsWith("(") && text.endsWith(")")) {
    negative = true;
    text = text.slice(1, -1).trim();
  }

  text = text.replace(/,/g, "").replace(/\s/g, "");
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }

  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return negative ? -Math.abs(value) : value;
}
