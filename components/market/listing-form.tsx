"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/upload-client";
import { LISTING_CATEGORIES } from "@/lib/marketplace";

export type ListingInitial = {
  id?: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: string;
  condition: string;
  location: string;
  images: string[];
};

const BLANK: ListingInitial = {
  title: "",
  description: "",
  price: 0,
  negotiable: false,
  category: "lainnya",
  condition: "used",
  location: "",
  images: [],
};

export function ListingForm({ initial }: { initial?: ListingInitial }) {
  const router = useRouter();
  const [form, setForm] = React.useState<ListingInitial>(initial ?? BLANK);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const set = <K extends keyof ListingInitial>(k: K, v: ListingInitial[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function addFiles(files: FileList) {
    for (const file of Array.from(files).slice(0, 8)) {
      if (!file.type.startsWith("image/")) continue;
      setUploading((n) => n + 1);
      try {
        const up = await uploadFile(file, { prefix: "market" });
        setForm((f) => ({ ...f, images: [...f.images, up.url].slice(0, 8) }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal upload");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const isEdit = !!form.id;
      const res = await fetch(
        isEdit ? `/api/listings/${form.id}` : "/api/listings",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      toast.success(isEdit ? "Iklan diperbarui" : "Iklan dipasang");
      router.push(data.slug ? `/market/${data.slug}` : "/market/mine");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Judul</Label>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Foto (maks 8)</Label>
        <div className="flex flex-wrap gap-2">
          {form.images.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-20 w-20 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "images",
                    form.images.filter((_, x) => x !== i),
                  )
                }
                className="absolute -right-1.5 -top-1.5 rounded-full bg-background p-0.5 shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {form.images.length < 8 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-accent"
            >
              {uploading > 0 ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Harga (Rp)</Label>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => set("negotiable", e.target.checked)}
          />
          Bisa nego
        </label>
        <label className="flex items-center gap-1.5">
          Kondisi:
          <select
            value={form.condition}
            onChange={(e) => set("condition", e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1"
          >
            <option value="used">Bekas</option>
            <option value="new">Baru</option>
          </select>
        </label>
      </div>

      <div className="space-y-1.5">
        <Label>Lokasi (opsional)</Label>
        <Input
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          maxLength={80}
          placeholder="mis. Jakarta Selatan"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Deskripsi</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="min-h-32"
          maxLength={4000}
          required
        />
      </div>

      <Button type="submit" disabled={busy || uploading > 0}>
        {busy ? "Menyimpan…" : form.id ? "Simpan perubahan" : "Pasang iklan"}
      </Button>
    </form>
  );
}
