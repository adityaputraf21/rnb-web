"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  Check,
  X,
  Users,
  MoreVertical,
  LogOut,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials, cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { uploadFile } from "@/lib/upload-client";

type Sender = { username: string; name: string | null; image: string | null };
type Msg = {
  id: string;
  body: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  mine: boolean;
  edited: boolean;
  deleted: boolean;
  sender: Sender;
};
type Member = Sender & { role: string };

export function GroupChat({
  group,
  initialMessages,
  members: initialMembers,
  iAmOwner,
}: {
  group: { id: string; name: string };
  initialMessages: Msg[];
  members: Member[];
  iAmOwner: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [members, setMembers] = React.useState<Member[]>(initialMembers);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [showMembers, setShowMembers] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const scrollDown = React.useCallback(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, []);
  React.useEffect(() => {
    scrollDown();
  }, [scrollDown]);

  React.useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/groups/${group.id}/messages`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => {
            if (data.messages.length !== prev.length) {
              requestAnimationFrame(scrollDown);
              return data.messages;
            }
            return prev;
          });
        }
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [group.id, scrollDown]);

  async function send(bodyText: string, media?: { url: string; type: string }) {
    if (!bodyText.trim() && !media) return;
    setSending(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: bodyText,
          mediaUrl: media?.url,
          mediaType: media?.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      setMessages((m) => [...m, data]);
      setText("");
      requestAnimationFrame(scrollDown);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setSending(false);
    }
  }

  async function onFile(file: File) {
    setUploading(true);
    try {
      const up = await uploadFile(file, { prefix: "group" });
      await send("", { url: up.url, type: up.kind });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/groups/${group.id}/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editText }),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    setMessages((m) =>
      m.map((x) =>
        x.id === id ? { ...x, body: editText.trim(), edited: true } : x,
      ),
    );
    setEditId(null);
  }

  async function del(id: string) {
    if (!confirm("Hapus pesan ini?")) return;
    const res = await fetch(`/api/groups/${group.id}/messages/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return toast.error("gagal");
    setMessages((m) =>
      m.map((x) =>
        x.id === id
          ? { ...x, deleted: true, body: "", mediaUrl: null, mediaType: null }
          : x,
      ),
    );
  }

  async function groupAction(action: string, extra?: Record<string, string>) {
    const res = await fetch(`/api/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!res.ok) return toast.error((await res.json()).error ?? "gagal");
    if (action === "leave") {
      toast.success("Kamu keluar dari grup");
      router.push("/messages");
      return;
    }
    if (action === "rename") toast.success("Nama grup diperbarui");
    if (action === "add") {
      toast.success("Anggota ditambahkan");
      const r = await fetch(`/api/groups/${group.id}`);
      if (r.ok) setMembers((await r.json()).members);
    }
    router.refresh();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border">
      <div className="flex items-center gap-3 border-b p-3">
        <Button variant="ghost" size="icon" className="sm:hidden" asChild>
          <Link href="/messages">
            <ArrowLeft />
          </Link>
        </Button>
        <button
          onClick={() => setShowMembers(true)}
          className="flex flex-1 items-center gap-2 text-left font-medium"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate">{group.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {members.length} anggota
            </span>
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowMembers(true)}>
              <Users /> Lihat anggota
            </DropdownMenuItem>
            {iAmOwner && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    const n = prompt("Nama grup baru:", group.name);
                    if (n?.trim()) groupAction("rename", { name: n });
                  }}
                >
                  <Pencil /> Ganti nama
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const u = prompt("Username yang mau ditambahkan:");
                    if (u?.trim())
                      groupAction("add", { username: u.replace(/^@/, "") });
                  }}
                >
                  <UserPlus /> Tambah anggota
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (confirm("Keluar dari grup ini?")) groupAction("leave");
              }}
            >
              <LogOut /> Keluar grup
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pesan di {group.name}.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "group flex items-end gap-2",
              m.mine ? "justify-end" : "justify-start",
            )}
          >
            {!m.mine && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={m.sender.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials(m.sender.name ?? m.sender.username)}
                </AvatarFallback>
              </Avatar>
            )}
            {m.mine && !m.deleted && editId !== m.id && (
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                {m.body && (
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditId(m.id);
                      setEditText(m.body);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  className="p-1 text-muted-foreground hover:text-destructive"
                  onClick={() => del(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3 py-1.5 text-sm",
                m.deleted
                  ? "border bg-transparent italic text-muted-foreground"
                  : m.mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted",
              )}
            >
              {!m.mine && !m.deleted && (
                <p className="mb-0.5 text-xs font-medium opacity-70">
                  {m.sender.name ?? m.sender.username}
                </p>
              )}
              {m.deleted ? (
                <p>Pesan ini dihapus</p>
              ) : editId === m.id ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(m.id);
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="w-48 rounded bg-white/20 px-2 py-0.5 text-sm outline-none"
                  />
                  <button onClick={() => saveEdit(m.id)}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  {m.mediaUrl &&
                    (m.mediaType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.mediaUrl}
                        alt=""
                        className="mb-1 max-h-64 rounded-lg"
                      />
                    ) : m.mediaType === "video" ? (
                      <video
                        src={m.mediaUrl}
                        controls
                        className="mb-1 max-h-64 rounded-lg"
                      />
                    ) : m.mediaType === "audio" ? (
                      <audio
                        src={m.mediaUrl}
                        controls
                        className="mb-1 h-10 w-56 max-w-full"
                      />
                    ) : (
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-1 flex items-center gap-1 underline"
                      >
                        <FileText className="h-4 w-4" /> Lampiran
                      </a>
                    ))}
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  <p
                    className={cn(
                      "mt-0.5 text-[10px]",
                      m.mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {timeAgo(m.createdAt)}
                    {m.edited && " · disunting"}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex items-center gap-2 border-t p-2"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf,.zip"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Kirim ke ${group.name}…`}
          maxLength={4000}
          className="h-9 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()}>
          <Send />
        </Button>
      </form>

      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anggota {group.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {members.map((mem) => (
              <Link
                key={mem.username}
                href={`/u/${mem.username}`}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={mem.image ?? undefined} />
                  <AvatarFallback>
                    {initials(mem.name ?? mem.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm">
                  {mem.name ?? mem.username}{" "}
                  <span className="text-muted-foreground">@{mem.username}</span>
                </span>
                {mem.role === "owner" && (
                  <span className="text-xs text-primary">pembuat</span>
                )}
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
