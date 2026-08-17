const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function utcDate(year: number, monthIndex: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function expandYear(year: number): number {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function parseUsNumeric(first: number, second: number, yearRaw: number): Date | null {
  const year = expandYear(yearRaw);
  if (first > 12) {
    return utcDate(year, second - 1, first);
  }
  if (second > 12) {
    return utcDate(year, first - 1, second);
  }
  // Ambiguous — US bank statements use MM/DD.
  return utcDate(year, first - 1, second);
}

export function parseDate(value: string): Date | null {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) {
    return utcDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const numeric = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(text);
  if (numeric) {
    return parseUsNumeric(Number(numeric[1]), Number(numeric[2]), Number(numeric[3]));
  }

  const named = /^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{2,4})$/.exec(text);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month == null) return null;
    return utcDate(expandYear(Number(named[3])), month, Number(named[1]));
  }

  const namedUs = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{2,4})$/.exec(text);
  if (namedUs) {
    const month = MONTHS[namedUs[1].toLowerCase()];
    if (month == null) return null;
    return utcDate(expandYear(Number(namedUs[3])), month, Number(namedUs[2]));
  }

  return null;
}

export function formatDateIso(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Normalize any date string to YYYY-MM-DD when parseable. */
export function normalizeDateString(value: string): string {
  const parsed = parseDate(value);
  if (parsed) return formatDateIso(parsed);

  const embedded = /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/.exec(value.trim());
  if (embedded) {
    const fromEmbedded = parseDate(embedded[1]);
    if (fromEmbedded) return formatDateIso(fromEmbedded);
  }

  return value.trim();
}
