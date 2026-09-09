"use client";

import { signIn } from "next-auth/react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignInButton({
  callbackUrl = "/forum",
  children = "Masuk dengan Discord",
  ...props
}: ButtonProps & { callbackUrl?: string }) {
  return (
    <Button onClick={() => signIn("discord", { callbackUrl })} {...props}>
      {children}
    </Button>
  );
}
