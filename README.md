# Accounting Frontend

Next.js (TypeScript) frontend for the accounting system, configured with Tailwind CSS and shadcn/ui.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (New York style)

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

App runs at http://localhost:3000.

## Features

- Drag-and-drop multi-file upload (PDF / Excel)
- Sequential extraction via backend + GPT
- Transactions table with Amount formatting
- Download as Excel, PDF, or CSV

## Environment

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Python API base URL (default: `http://localhost:8000/api/v1`) |
