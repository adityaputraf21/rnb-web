"use client";

import * as React from "react";
import { Plus, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PollDraft = {
  question: string;
  options: string[];
  multiple: boolean;
};

export function PollComposer({
  value,
  onChange,
}: {
  value: PollDraft | null;
  onChange: (v: PollDraft | null) => void;
}) {
  if (!value) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({ question: "", options: ["", ""], multiple: false })
        }
      >
        <BarChart3 /> Tambah polling
      </Button>
    );
  }

  const set = (patch: Partial<PollDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Polling</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Input
        placeholder="Pertanyaan"
        value={value.question}
        onChange={(e) => set({ question: e.target.value })}
        maxLength={200}
      />
      {value.options.map((o, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder={`Opsi ${i + 1}`}
            value={o}
            onChange={(e) => {
              const opts = [...value.options];
              opts[i] = e.target.value;
              set({ options: opts });
            }}
            maxLength={100}
          />
          {value.options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                set({ options: value.options.filter((_, x) => x !== i) })
              }
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between">
        {value.options.length < 6 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => set({ options: [...value.options, ""] })}
          >
            <Plus /> Opsi
          </Button>
        )}
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={value.multiple}
            onChange={(e) => set({ multiple: e.target.checked })}
          />
          Boleh pilih lebih dari satu
        </label>
      </div>
    </div>
  );
}

/** Validasi minimal untuk dikirim ke API. */
export function pollPayload(d: PollDraft | null) {
  if (!d) return undefined;
  const options = d.options.map((o) => o.trim()).filter(Boolean);
  if (!d.question.trim() || options.length < 2) return undefined;
  return { question: d.question.trim(), options, multiple: d.multiple };
}
