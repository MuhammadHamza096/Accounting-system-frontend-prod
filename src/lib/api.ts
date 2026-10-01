const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type StatementType = "bank" | "credit_card";

export type Transaction = {
  date: string;
  description: string;
  deposit: number | null;
  withdrawal: number | null;
  source_file: string;
};

export type ExtractResponse = {
  statement_type: StatementType;
  opening_balance: number | null;
  closing_balance: number | null;
  transactions: Transaction[];
  statements?: StatementSummary[];
  warnings?: string[];
};

export type StatementSummary = {
  source_file: string;
  bank: string;
  account_last4: string;
  period_start: string;
  period_end: string;
  opening_balance: number | null;
  closing_balance: number | null;
  total_deposits: number;
  total_withdrawals: number;
  transaction_count: number;
};

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ");
    }
  } catch {
    // ignore JSON parse errors
  }
  return `API error ${response.status}: ${response.statusText}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<T>;
}

export async function extractStatements(
  files: File[],
  expectedType?: StatementType
): Promise<ExtractResponse> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  if (expectedType) {
    form.append("expected_type", expectedType);
  }

  const response = await fetch(`${API_URL}/statements/extract`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<ExtractResponse>;
}

export async function extractStatement(
  file: File,
  expectedType?: StatementType
): Promise<ExtractResponse> {
  return extractStatements([file], expectedType);
}
