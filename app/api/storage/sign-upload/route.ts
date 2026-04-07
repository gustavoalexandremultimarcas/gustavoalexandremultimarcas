export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { vehicleId, mime } = await req.json();

  // defina extensão real
  const ext = mime === "image/webp" ? "webp" :
              mime === "image/jpeg" ? "jpg"  :
              mime === "image/png"  ? "png"  : "bin";

  const path = `vehicles/${vehicleId}/${crypto.randomUUID()}.${ext}`;

  // 15 min de validade normalmente é suficiente
  const { data, error } = await supabase
    .storage
    .from("vehicles-media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Falha ao assinar upload" }, { status: 500 });
  }

  // devolve o token e o path que você usará no client
  return NextResponse.json({ path, token: data.token, url: data.signedUrl });
}
