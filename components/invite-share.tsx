"use client";

import * as React from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteShare({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link disalin");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Gabung RnB",
          text: "Gabung komunitas RnB yuk",
          url: link,
        });
      } catch {
        /* dibatalkan */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input readOnly value={link} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button type="button" size="icon" onClick={share}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Kode: <span className="font-mono font-medium">{code}</span>
      </p>
    </div>
  );
}
