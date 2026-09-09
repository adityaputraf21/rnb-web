"use client";

import * as React from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { uploadFile } from "@/lib/upload-client";

type MentionUser = { username: string; name: string | null; image: string | null };

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Tulis pakai Markdown. @sebut untuk mention, tempel/seret gambar untuk upload.",
  minHeight = 160,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [mentions, setMentions] = React.useState<MentionUser[]>([]);
  const [mentionRange, setMentionRange] = React.useState<
    { start: number; end: number } | null
  >(null);

  function insertAtCursor(text: string) {
    const el = ref.current;
    if (!el) return onChange(value + text);
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: "forum" });
      const isImage = up.kind === "image";
      insertAtCursor(`${isImage ? "!" : ""}[${up.name}](${up.url})\n`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files)[0];
    if (file) {
      e.preventDefault();
      handleUploadFile(file);
    }
  }

  function onDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.dataTransfer.files)[0];
    if (file) {
      e.preventDefault();
      handleUploadFile(file);
    }
  }

  async function handleChange(next: string) {
    onChange(next);
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = next.slice(0, caret);
    const m = before.match(/(?:^|\s)@([a-z0-9-]{1,24})$/i);
    if (m) {
      const start = caret - m[1].length - 1;
      setMentionRange({ start, end: caret });
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(m[1])}`,
        );
        setMentions(res.ok ? await res.json() : []);
      } catch {
        setMentions([]);
      }
    } else {
      setMentionRange(null);
      setMentions([]);
    }
  }

  function pickMention(u: MentionUser) {
    if (!mentionRange) return;
    const next =
      value.slice(0, mentionRange.start) +
      `@${u.username} ` +
      value.slice(mentionRange.end);
    onChange(next);
    setMentionRange(null);
    setMentions([]);
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <Tabs defaultValue="write" className="w-full">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="write">Tulis</TabsTrigger>
          <TabsTrigger value="preview">Pratinjau</TabsTrigger>
        </TabsList>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ImagePlus />
          )}
          Gambar / file
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <TabsContent value="write" className="relative">
        <Textarea
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          placeholder={placeholder}
          style={{ minHeight }}
          className="font-mono text-sm"
        />
        {mentionRange && mentions.length > 0 && (
          <div className="absolute left-2 top-full z-20 mt-1 w-56 overflow-hidden rounded-md border bg-popover shadow-md">
            {mentions.map((u) => (
              <button
                key={u.username}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => pickMention(u)}
              >
                <span className="font-medium">@{u.username}</span>
                {u.name && (
                  <span className="truncate text-xs text-muted-foreground">
                    {u.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="preview">
        <div
          className="rounded-md border p-3"
          style={{ minHeight }}
        >
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada isi.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
