import { APP_DOMAIN, APP_NAME } from "@/lib/brand";

/**
 * Optional waitlist confirmation via Resend.
 * Never throws for missing config — signup must succeed even when email is off.
 */
export async function sendWaitlistConfirmationEmail(
  to: string,
  name?: string
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WAITLIST_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "RESEND_API_KEY or WAITLIST_FROM_EMAIL not set",
    };
  }

  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `You're on the ${APP_NAME} waitlist`,
        text: [
          greeting,
          "",
          `You're on the ${APP_NAME} waitlist.`,
          "",
          "We'll email again when early access opens in London.",
          "No spam. No drip sequence.",
          "",
          `${APP_NAME} · ${APP_DOMAIN}`,
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        "[waitlist] Resend failed:",
        res.status,
        body.slice(0, 200)
      );
      return { sent: false, reason: `Resend HTTP ${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.warn("[waitlist] Resend request error:", err);
    return { sent: false, reason: "network error" };
  }
}
