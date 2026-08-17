export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Negatives always in parentheses: (6,553.00) */
export function formatSignedAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  if (value < 0) return `(${formatMoney(Math.abs(value))})`;
  return formatMoney(value);
}

/** Deposit shown plain; withdrawal shown in parentheses e.g. (50.00) */
export function formatAmount(
  deposit: number | null | undefined,
  withdrawal: number | null | undefined
): string {
  if (withdrawal != null && withdrawal > 0) {
    return `(${formatMoney(withdrawal)})`;
  }
  if (deposit != null && deposit > 0) {
    return formatMoney(deposit);
  }
  if (deposit === 0 || withdrawal === 0) {
    return formatMoney(0);
  }
  return "";
}
