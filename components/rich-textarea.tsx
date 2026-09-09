"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/emoji-picker";
import { initials, cn } from "@/lib/utils";

type U = { username: string; name: string | null; image: string | null };

type Props = Omit<
  React.ComponentPropsWithoutRef<typeof Textarea>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (v: string) => void;
  emoji?: boolean;
};

/** Textarea + autocomplete @mention + tombol emoji. */
export function RichTextarea({
  value,
  onChange,
  emoji = true,
  className,
  ...rest
}: Props) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [matches, setMatches] = React.useState<U[]>([]);
  const [token, setToken] = React.useState<{ start: number; q: string } | null>(
    null,
  );
  const [active, setActive] = React.useState(0);

  const detect = React.useCallback((el: HTMLTextAreaElement) => {
    const pos = el.selectionStart ?? 0;
    const before = el.value.slice(0, pos);
    const m = before.match(/(?:^|\s)@([a-z0-9_-]{0,24})$/i);
    if (m) {
      setToken({ start: pos - m[1].length, q: m[1] });
    } else {
      setToken(null);
      setMatches([]);
    }
  }, []);

  React.useEffect(() => {
    if (!token) return;
    if (token.q.length < 1) {
      setMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(token.q)}`,
        );
        if (res.ok) {
          setMatches(await res.json());
          setActive(0);
        }
      } catch {
        /* ignore */
      }
    }, 180);
    return () => clearTimeout(t);
  }, [token]);

  function insertMention(u: U) {
    if (!token || !ref.current) return;
    const el = ref.current;
    const end = el.selectionStart ?? token.start;
    const next =
      value.slice(0, token.start) + `${u.username} ` + value.slice(end);
    onChange(next);
    setToken(null);
    setMatches([]);
    requestAnimationFrame(() => {
      const caret = token.start + u.username.length + 1;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function insertEmoji(e: string) {
    const el = ref.current;
    const pos = el?.selectionStart ?? value.length;
    onChange(value.slice(0, pos) + e + value.slice(pos));
    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(pos + e.length, pos + e.length);
      }
    });
  }

  return (
    <div className="relative">
      <Textarea
        {...rest}
        ref={ref}
        value={value}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target);
        }}
        onKeyUp={(e) => detect(e.currentTarget)}
        onClick={(e) => detect(e.currentTarget)}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            insertMention(matches[active]);
          } else if (e.key === "Escape") {
            setToken(null);
            setMatches([]);
          }
        }}
      />

      {emoji && (
        <div className="absolute bottom-1 right-1">
          <EmojiPicker
            onPick={insertEmoji}
            trigger={
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Emoji"
              >
                <span className="text-base">😊</span>
              </button>
            }
          />
        </div>
      )}

      {matches.length > 0 && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border bg-popover shadow-md">
          {matches.map((u, i) => (
            <button
              key={u.username}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(u);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm",
                i === active ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {initials(u.name ?? u.username)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {u.name ?? u.username}{" "}
                <span className="text-muted-foreground">@{u.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
