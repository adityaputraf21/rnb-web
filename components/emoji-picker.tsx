"use client";

import * as React from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const GROUPS: Record<string, string[]> = {
  Wajah: "😀 😃 😄 😁 😆 😅 😂 🤣 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 😐 😑 😶 😏 😒 🙄 😬 😴 😌 😔 🤤 😪 😷 🤒 🤕 🤢 🤮 🥴 😵 🤯 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡".split(" "),
  Isyarat: "👍 👎 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 💪 🦾 ✍️ 💅 👏 🙌 👐 🤲 🤛 🤜 ✊ 👊".split(" "),
  Hati: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️".split(" "),
  Objek: "🔥 ✨ ⭐ 🌟 💫 💥 💯 ✅ ❌ ❓ ❗ 🎉 🎊 🎁 🏆 🥇 🎯 💡 📌 📎 🔔 🔕 💬 👀 🫶 🙈 🙉 🙊 🤖 👑 🚀 ⚡ 🌈 ☀️ 🌙 💤 💦 💨 🍀".split(" "),
  Hewan: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦄 🐝 🦋 🐢 🐍 🐙 🦕 🐳 🐬 🐟".split(" "),
  Makanan: "🍕 🍔 🍟 🌭 🍿 🧀 🍗 🍖 🌮 🌯 🥙 🥗 🍜 🍝 🍣 🍦 🍩 🍪 🎂 🍰 🍫 🍬 🍭 ☕ 🍵 🧋 🍺 🍻 🥂 🍷".split(" "),
};

export function EmojiPicker({
  onPick,
  trigger,
}: {
  onPick: (emoji: string) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="icon">
            <Smile />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-72 overflow-y-auto p-2">
        {Object.entries(GROUPS).map(([name, emojis]) => (
          <div key={name} className="mb-2">
            <p className="mb-1 px-1 text-[11px] font-medium uppercase text-muted-foreground">
              {name}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {emojis.map((e, i) => (
                <button
                  key={`${e}-${i}`}
                  type="button"
                  onClick={() => {
                    onPick(e);
                    setOpen(false);
                  }}
                  className="rounded p-1 text-lg hover:bg-accent"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
