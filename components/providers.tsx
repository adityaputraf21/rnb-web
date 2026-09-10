"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { PWA } from "@/components/pwa";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <CommandPalette />
        <PWA />
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
}
