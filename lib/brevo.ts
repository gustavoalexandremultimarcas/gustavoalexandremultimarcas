type BrevoAttachment = {
  name: string;
  content: string; // base64
};

type BrevoEmailPayload = {
  sender: { name?: string; email: string };
  to: Array<{ email: string; name?: string }>;
  replyTo?: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachment?: BrevoAttachment[];
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function sendBrevoEmail(input: {
  subject: string;
  html: string;
  text?: string;
  replyToEmail?: string;
  replyToName?: string;
  attachments?: BrevoAttachment[];
}) {
  const apiKey = mustEnv("BREVO_API_KEY");
  const from = mustEnv("MAIL_FROM");
  const to = mustEnv("MAIL_TO");
  const fromName = process.env.MAIL_FROM_NAME || "Site";

  const payload: BrevoEmailPayload = {
    sender: { email: from, name: fromName },
    to: [{ email: to }],
    subject: input.subject,
    htmlContent: input.html,
    textContent: input.text,
    attachment: input.attachments?.length ? input.attachments : undefined,
    replyTo: input.replyToEmail
      ? { email: input.replyToEmail, name: input.replyToName }
      : undefined,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Brevo send failed: HTTP ${res.status} ${errText}`.trim());
  }

  return res.json().catch(() => ({}));
}

