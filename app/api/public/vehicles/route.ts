import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getVehicleImageOriginal, getVehicleImageVariant } from "@/lib/vehicle-images";

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400";
const MAX_PUBLIC_LIMIT = 60;

type VehicleRow = {
  id: number;
  name: string;
  brand: string | null;
  price: string | null;
  year: string | null;
  fuel: string | null;
  transmission: string | null;
  badge: string | null;
  description: string | null;
  available: boolean;
  spotlight: boolean;
  km: string | null;
};

type VehicleImageRow = {
  vehicle_id: number;
  image_url: string | null;
  image_meta?: any;
  display_order: number | null;
};

function withCache(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

export async function GET(request: Request) {
  const supabase = supabaseAdmin();
  const { searchParams } = new URL(request.url);

  const spotlightOnly = searchParams.get("spotlight") === "1";
  const withFirstImage = searchParams.get("withFirstImage") === "1";
  const withImages = searchParams.get("withImages") === "1";
  const summaryOnly = searchParams.get("summary") === "1";
  const limit = Number(searchParams.get("limit") ?? "0");
  const idParam = searchParams.get("id");

  const fuel = searchParams.get("fuel");
  const fuelIlike = searchParams.get("fuelIlike");
  const parsedId = idParam ? Number(idParam) : null;
  const selectClause = summaryOnly
    ? "id, name"
    : "id, name, brand, price, year, fuel, transmission, badge, description, available, spotlight, km";

  if (idParam && (!Number.isInteger(parsedId) || (parsedId ?? 0) <= 0)) {
    return withCache({ error: "ID inválido" }, 400);
  }

  const safeLimit =
    limit > 0 ? Math.min(Math.trunc(limit), MAX_PUBLIC_LIMIT) : 0;

  let q = supabase
    .from("vehicles")
    .select(selectClause)
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (parsedId) q = q.eq("id", parsedId);
  if (spotlightOnly) q = q.eq("spotlight", true);
  if (fuel) q = q.eq("fuel", fuel);
  if (fuelIlike) q = q.ilike("fuel", `%${fuelIlike}%`);
  if (safeLimit > 0) q = q.limit(safeLimit);

  const { data, error } = await q;
  if (error) {
    console.error("GET /api/public/vehicles error:", error);
    return withCache({ error: error.message }, 500);
  }

  const vehicles = ((data ?? []) as unknown) as VehicleRow[];

  for (const v of vehicles ?? []) {
    (v as any).first_image_url = null;
    (v as any).first_image_thumb_url = null;
    (v as any).images = undefined;
  }

  if ((withFirstImage || withImages) && vehicles?.length) {
    const ids = vehicles.map(v => v.id);
    const { data: imgs, error: imgErr } = await supabase
      .from("vehicle_images")
      .select("vehicle_id, image_url, image_meta, display_order")
      .in("vehicle_id", ids)
      .order("vehicle_id", { ascending: true })
      .order("display_order", { ascending: true });

    if (imgErr) {
      console.error("Erro ao buscar imagens públicas:", imgErr);
    } else if (imgs?.length) {
      const firstByVehicle = new Map<
        number,
        { image_url: string; thumb_url: string }
      >();
      const grouped = new Map<
        number,
        Array<{ image_url: string; thumb_url: string }>
      >();

      for (const rawImg of imgs as VehicleImageRow[]) {
        const originalUrl = getVehicleImageOriginal(
          rawImg.image_meta,
          rawImg.image_url
        );
        const thumbUrl = getVehicleImageVariant(
          rawImg.image_meta,
          withImages ? "detail" : "card",
          rawImg.image_url
        );

        if (!firstByVehicle.has(rawImg.vehicle_id)) {
          firstByVehicle.set(rawImg.vehicle_id, {
            image_url: originalUrl,
            thumb_url: getVehicleImageVariant(
              rawImg.image_meta,
              "card",
              rawImg.image_url
            ),
          });
        }

        if (withImages) {
          const arr = grouped.get(rawImg.vehicle_id) ?? [];
          arr.push({
            image_url: originalUrl,
            thumb_url: thumbUrl,
          });
          grouped.set(rawImg.vehicle_id, arr);
        }
      }

      for (const v of vehicles) {
        const first = firstByVehicle.get(v.id);
        (v as any).first_image_url = first?.image_url ?? null;
        (v as any).first_image_thumb_url = first?.thumb_url ?? null;
        if (withImages) {
          (v as any).images = grouped.get(v.id) ?? [];
        }
      }
    } else {
      for (const v of vehicles ?? []) {
        (v as any).first_image_url = null;
        (v as any).first_image_thumb_url = null;
        if (withImages) {
          (v as any).images = [];
        }
      }
    }
  }

  return withCache({ vehicles });
}
