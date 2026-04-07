import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const availableOnly  = searchParams.get("availableOnly") === "1";
  const spotlightOnly  = searchParams.get("spotlight") === "1";
  const withFirstImage = searchParams.get("withFirstImage") === "1";
  const withImages     = searchParams.get("withImages") === "1";
  const limit          = Number(searchParams.get("limit") ?? "0");
  const idParam        = searchParams.get("id");

  const fuel      = searchParams.get("fuel");
  const fuelIlike = searchParams.get("fuelIlike");

  let q = supabase
    .from("vehicles")
    .select("id, name, brand, price, year, fuel, transmission, badge, description, available, spotlight, km")
    .order("created_at", { ascending: false });

  if (idParam)       q = q.eq("id", Number(idParam));
  if (availableOnly) q = q.eq("available", true);
  if (spotlightOnly) q = q.eq("spotlight", true);
  if (fuel)          q = q.eq("fuel", fuel);
  if (fuelIlike)     q = q.ilike("fuel", `%${fuelIlike}%`);
  if (limit > 0)     q = q.limit(limit);

  const { data: vehicles, error } = await q;
  if (error) {
    console.error("GET /api/public/vehicles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const isHttpUrl = (u?: string | null) => !!u && /^https?:\/\//i.test(u);

  // Para evitar undefined no client:
  for (const v of vehicles ?? []) {
    (v as any).first_image_url = null;
    (v as any).images = undefined;
  }

  if (withFirstImage && vehicles?.length) {
    const ids = vehicles.map(v => v.id);
    const { data: imgs, error: imgErr } = await supabase
      .from("vehicle_images")
      .select("vehicle_id, image_url, display_order")
      .in("vehicle_id", ids)
      .order("vehicle_id", { ascending: true })
      .order("display_order", { ascending: true });

    if (imgErr) {
      console.error("Erro ao buscar imagens (first):", imgErr);
    } else if (imgs?.length) {
      const firstByVehicle = new Map<number, string>();
      for (const img of imgs) {
        const url = img.image_url?.trim?.() ?? "";
        if (!firstByVehicle.has(img.vehicle_id) && isHttpUrl(url)) {
          firstByVehicle.set(img.vehicle_id, url);
        }
      }
      for (const v of vehicles) {
        (v as any).first_image_url = firstByVehicle.get(v.id) ?? null;
      }
    }
  }

  if (withImages && vehicles?.length) {
    const ids = vehicles.map(v => v.id);
    const { data: imgs, error: allErr } = await supabase
      .from("vehicle_images")
      .select("vehicle_id, image_url, display_order")
      .in("vehicle_id", ids)
      .order("vehicle_id", { ascending: true })
      .order("display_order", { ascending: true });

    if (allErr) {
      console.error("Erro ao buscar imagens (all):", allErr);
    } else if (imgs?.length) {
      const grouped = new Map<number, string[]>();
      for (const img of imgs) {
        const url = img.image_url?.trim?.() ?? "";
        if (!isHttpUrl(url)) continue;
        const arr = grouped.get(img.vehicle_id) ?? [];
        arr.push(url);
        grouped.set(img.vehicle_id, arr);
      }
      for (const v of vehicles) {
        (v as any).images = grouped.get(v.id) ?? [];
      }
    } else {
      for (const v of vehicles) {
        (v as any).images = [];
      }
    }
  }

  return NextResponse.json({ vehicles });
}
