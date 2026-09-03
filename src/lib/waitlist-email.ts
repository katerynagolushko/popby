import { APP_NAME, EMAIL_LOGO_URL } from "@/lib/brand";

/**
 * Optional waitlist confirmation via Resend.
 * Never throws for missing config — signup must succeed even when email is off.
 *
 * Env:
 * - RESEND_API_KEY
 * - WAITLIST_FROM_EMAIL e.g. "Hangbyme <hello@hangby.me>"
 * - WAITLIST_REPLY_TO optional, e.g. "kat@hangby.me"
 *
 * Sends HTML + text. The in-body logo is EMAIL_LOGO_URL.
 * Resend cannot set Gmail's sender-chip avatar (BIMI / Google profile / Gravatar).
 */

const WAITLIST_REPLY_TO = "kat@hangby.me";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waitlistCopy(greeting: string): {
  greeting: string;
  paragraphs: string[];
  signOff: string[];
  ps: string;
} {
  return {
    greeting,
    paragraphs: [
      "Thank you for joining the waitlist for hangby.me. You are one step closer to making a real human connection. Once we have enough users to go live with it, we will launch it.",
      "Would appreciate it if you could share what you think about the product, what features you'd like to see live. If you are down, reply to this email and we'll talk. Very keen on learning what you think.",
    ],
    signOff: ["Stay alive and let's goo,", "Kateryna", "Founder of Hangby.me"],
    ps: "P.S. We want to solve global loneliness epidemic and make human connection much more frictionless. We will start by giving people within London's startup community an option to spontaneously hang out with people who match their preferences.",
  };
}

function waitlistText(copy: ReturnType<typeof waitlistCopy>): string {
  return [
    copy.greeting,
    "",
    copy.paragraphs[0],
    "",
    copy.paragraphs[1],
    "",
    ...copy.signOff,
    "",
    copy.ps,
  ].join("\n");
}

function p(text: string, extraStyle = ""): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#12141c;${extraStyle}">${escapeHtml(text)}</p>`;
}

function waitlistHtml(copy: ReturnType<typeof waitlistCopy>): string {
  const [stayAlive, name, title] = copy.signOff;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(APP_NAME)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px 36px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <img src="${EMAIL_LOGO_URL}" width="72" height="72" alt="${escapeHtml(APP_NAME)}" style="display:block;border:0;outline:none;text-decoration:none;margin:0 0 24px;width:72px;height:72px;" />
    ${p(copy.greeting)}
    ${p(copy.paragraphs[0])}
    ${p(copy.paragraphs[1])}
    ${p(stayAlive, "margin-bottom:4px;")}
    ${p(name, "margin-bottom:0;")}
    ${p(title, "margin-bottom:24px;")}
    ${p(copy.ps, "margin-bottom:0;")}
  </div>
</body>
</html>`;
}

export async function sendWaitlistConfirmationEmail(
  to: string,
  name?: string
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.WAITLIST_FROM_EMAIL?.trim();
  const replyTo =
    process.env.WAITLIST_REPLY_TO?.trim() || WAITLIST_REPLY_TO;

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "RESEND_API_KEY or WAITLIST_FROM_EMAIL not set",
    };
  }

  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";
  const copy = waitlistCopy(greeting);

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
        reply_to: replyTo,
        subject: `You're on the ${APP_NAME} waitlist`,
        text: waitlistText(copy),
        html: waitlistHtml(copy),
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
