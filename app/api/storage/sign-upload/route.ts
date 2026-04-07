export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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
