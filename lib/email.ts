const FROM = process.env.EMAIL_FROM ?? "RnB <onboarding@resend.dev>";

export function emailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

/** Kirim email via Resend REST API. No-op kalau RESEND_API_KEY tidak diset. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
