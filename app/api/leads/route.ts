import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/brevo";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toText(v: unknown) {
  if (v == null) return "";
  return String(v).trim();
}

function wrapEmailHtml(title: string, rows: Array<[string, string]>) {
  const body = rows
    .filter(([, v]) => v.length)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;width:180px;"><strong>${escapeHtml(
          k
        )}</strong></td><td style="padding:8px 12px;border:1px solid #eee;">${escapeHtml(
          v
        )}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;">
    <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
      <div style="padding:16px 20px;background:#111;color:#fff;">
        <div style="font-size:16px;font-weight:700;">${escapeHtml(title)}</div>
        <div style="font-size:12px;opacity:.8;">Enviado pelo site</div>
      </div>
      <div style="padding:18px 20px;">
        <table style="border-collapse:collapse;width:100%;font-size:14px;">${body}</table>
      </div>
    </div>
  </body>
</html>`;
}

async function fileToBrevoAttachment(file: File) {
  const bytes = await file.arrayBuffer();
  const b64 = Buffer.from(bytes).toString("base64");
  return { name: file.name || "anexo", content: b64 };
}

function isSupportedBrevoAttachment(file: File) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  // Brevo SMTP API costuma rejeitar webp. Mantemos apenas formatos comuns.
  if (type === "image/webp" || name.endsWith(".webp")) return false;
  if (type === "image/png" || name.endsWith(".png")) return true;
  if (type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg"))
    return true;

  return false;
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";

    let data: Record<string, any> = {};
    let attachments: Array<{ name: string; content: string }> | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        if (v instanceof File) continue;
        data[k] = v;
      }

      const anexo = fd.get("anexo");
      if (anexo instanceof File && anexo.size > 0) {
        // Evita payload gigante/erro no provedor. Brevo suporta anexos, mas mantemos conservador.
        const MAX = 4 * 1024 * 1024; // 4MB
        if (anexo.size <= MAX && isSupportedBrevoAttachment(anexo)) {
          attachments = [await fileToBrevoAttachment(anexo)];
        } else {
          const why =
            anexo.size > MAX
              ? "tamanho"
              : (anexo.type || "").toLowerCase() === "image/webp" ||
                (anexo.name || "").toLowerCase().endsWith(".webp")
              ? "formato webp não suportado"
              : "tipo não suportado";
          data.anexoInfo = `Arquivo recebido (${anexo.type || "desconhecido"}, ${anexo.size} bytes) — não anexado (${why}). Use PNG/JPG.`;
        }
      }
    } else {
      data = (await req.json().catch(() => ({}))) || {};
    }

    const tipoFormulario = toText(data.tipoFormulario) || "lead";
    const origem = toText(data.origem);

    const subject =
      origem && tipoFormulario
        ? `[Site] ${tipoFormulario} (${origem})`
        : `[Site] ${tipoFormulario || "lead"}`;

    const rows: Array<[string, string]> = [
      ["Tipo", tipoFormulario],
      ["Origem", origem],
      ["Nome", toText(data.nome)],
      ["Telefone", toText(data.telefone)],
      ["E-mail", toText(data.email)],
      ["Assunto", toText(data.assunto)],
      ["Mensagem", toText(data.mensagem)],
      ["Interesse", toText(data.interesse)],
      ["Veículo", toText(data.veiculo || data.veiculoNome)],
      ["Placa", toText(data.placa)],
      ["CPF", toText(data.cpf)],
      ["Você possui CNH?", toText(data.cnh)],
      ["Data de nascimento", toText(data.dataNascimento)],
      ["Valor de entrada", toText(data.valorEntrada)],
      ["Veículo ID", toText(data.veiculoId)],
      ["Veículo a consignar", toText(data.veiculo)],
      ["Ano", toText(data.ano)],
      ["Anexo", toText(data.anexoInfo)],
    ];

    const html = wrapEmailHtml("Novo contato pelo site", rows);
    const text = rows
      .filter(([, v]) => v.length)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    await sendBrevoEmail({
      subject,
      html,
      text,
      replyToEmail: toText(data.email) || undefined,
      replyToName: toText(data.nome) || undefined,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("lead mail error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Falha ao enviar" },
      { status: 500 }
    );
  }
}

