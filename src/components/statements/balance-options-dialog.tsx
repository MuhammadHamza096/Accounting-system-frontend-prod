"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseAmountInput } from "@/lib/amounts";
import { cn } from "@/lib/utils";

export type BalanceSource = "user" | "system";

export type BalanceOptions = {
  source: BalanceSource;
  opening: number | null;
  closing: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: BalanceOptions) => void;
};

export function BalanceOptionsDialog({ open, onOpenChange, onConfirm }: Props) {
  const [source, setSource] = useState<BalanceSource>("system");
  const [openingInput, setOpeningInput] = useState("");
  const [closingInput, setClosingInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    if (source === "system") {
      setError(null);
      onConfirm({ source, opening: null, closing: null });
      return;
    }

    const opening = parseAmountInput(openingInput);
    const closing = parseAmountInput(closingInput);
    if (opening == null || closing == null) {
      setError("Enter both opening and closing. Use 1200, -6553, or (6553).");
      return;
    }

    setError(null);
    onConfirm({ source, opening, closing });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opening and closing balance</DialogTitle>
          <DialogDescription>
            Choose whether you will enter the balances, or the system should
            read them from the statement (oldest date = opening, latest date =
            closing).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => {
              setSource("user");
              setError(null);
            }}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-sm transition-colors",
              source === "user"
                ? "border-foreground bg-muted"
                : "border-input hover:bg-muted/50"
            )}
          >
            I will enter opening and closing
          </button>
          <button
            type="button"
            onClick={() => {
              setSource("system");
              setError(null);
            }}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-sm transition-colors",
              source === "system"
                ? "border-foreground bg-muted"
                : "border-input hover:bg-muted/50"
            )}
          >
            System will extract from the statement
          </button>
        </div>

        {source === "user" && (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="opening-balance">Opening balance</Label>
              <Input
                id="opening-balance"
                value={openingInput}
                onChange={(event) => setOpeningInput(event.target.value)}
                placeholder="12000 or -6553 or (6553)"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="closing-balance">Closing balance</Label>
              <Input
                id="closing-balance"
                value={closingInput}
                onChange={(event) => setClosingInput(event.target.value)}
                placeholder="15000 or (200)"
              />
            </div>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm}>
            Extract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
