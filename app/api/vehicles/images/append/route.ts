// app/api/vehicles/images/append/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildVehicleImageMeta } from "@/lib/vehicle-images";

const MAX_IMAGES = 10;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const supabase = supabaseAdmin();
    const { vehicleId, items } = await req.json();
    if (!vehicleId || !Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // imagens já existentes
    const { data: existing, error: exErr } = await supabase
      .from("vehicle_images")
      .select("image_meta, display_order")
      .eq("vehicle_id", vehicleId)
      .order("display_order", { ascending: true });
    if (exErr) throw exErr;

    const already = existing?.length ?? 0;
    const slots = Math.max(0, MAX_IMAGES - already);
    if (!slots) {
      return NextResponse.json({ error: "Limite de 10 imagens já atingido" }, { status: 400 });
    }

    // Aceita payload compacto { path, mime, size, ext }
    // (e também tolera payload antigo com { image_meta: { path }, ... })
    const toNormalize = items.slice(0, slots).map((it: any) => {
      const path = it?.path ?? it?.image_meta?.path ?? "";
      const mime = it?.mime ?? it?.image_meta?.original?.mime ?? "image/webp";
      const size = it?.size ?? it?.image_meta?.sources?.original?.size ?? null;
      const ext = it?.ext ?? it?.image_meta?.sources?.original?.format ?? "webp";
      return { path, mime, size, ext };
    });

    // dedup por path
    const existingPaths = new Set<string>(
      (existing ?? []).map((x) => (x?.image_meta?.path as string) || "").filter(Boolean)
    );

    const picked = toNormalize.filter((it) => {
      if (!it.path) return false;
      if (existingPaths.has(it.path)) return false;
      existingPaths.add(it.path);
      return true;
    });

    if (!picked.length) {
      return NextResponse.json({ success: true, inserted: 0 });
    }

    // monta URL pública a partir do path
    const rows = picked.map((it, idx) => {
      const { data: pub } = supabase.storage
        .from("vehicles-media")
        .getPublicUrl(it.path);
      return {
        vehicle_id: vehicleId,
        image_url: pub.publicUrl,
        image_meta: buildVehicleImageMeta({
          path: it.path,
          publicUrl: pub.publicUrl,
          mime: it.mime ?? "image/webp",
          size: it.size ?? null,
          format: it.ext || "webp",
        }),
        display_order: already + idx,
      };
    });

    const { error: insErr } = await supabase.from("vehicle_images").insert(rows);
    if (insErr) throw insErr;

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (e: any) {
    console.error("append images error:", e);
    return NextResponse.json({ error: e?.message || "Erro ao registrar imagens" }, { status: 500 });
  }
}
