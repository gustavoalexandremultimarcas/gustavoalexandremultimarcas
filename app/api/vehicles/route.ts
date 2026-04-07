import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_IMAGES = 10;

// util de higiene básica: normaliza string vazia para null
const toNull = (v: unknown) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // ===== Dados do veículo (higienizados, sem mudar o schema) =====
    const vehicleData = {
      name: (formData.get("name") as string)?.trim(),
      brand: toNull(formData.get("brand")),
      price: toNull(formData.get("price")),
      year: toNull(formData.get("year")),
      fuel: toNull(formData.get("fuel")),
      transmission: toNull(formData.get("transmission")),
      km: toNull(formData.get("km")),
      color: toNull(formData.get("color")),
      placa: toNull(formData.get("placa")),
      doors: toNull(formData.get("doors")),
      badge: toNull(formData.get("badge")),
      description: toNull(formData.get("description")),
      spotlight: formData.get("spotlight") === "on",
      available: formData.get("available") === "on",
      updated_at: new Date().toISOString(),
    };

    if (!vehicleData.name) {
      return NextResponse.json(
        { error: "Nome do veículo é obrigatório." },
        { status: 400 }
      );
    }

    // ===== Criar veículo =====
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .insert([vehicleData])
      .select()
      .single();

    if (vehicleError) throw vehicleError;
    const vehicleId = vehicle.id as number;

    // ===== Features =====
    const rawFeatures = (formData.get("features") as string) || "[]";
    let featuresArr: string[] = [];
    try {
      featuresArr = JSON.parse(rawFeatures);
    } catch {
      featuresArr = [];
    }

    // limpa/filtra duplicados vazios
    const cleanFeatures = Array.from(
      new Set(
        (featuresArr || [])
          .map((f) => (f ?? "").toString().trim())
          .filter((f) => f.length)
      )
    );

    if (cleanFeatures.length > 0) {
      const rows = cleanFeatures.map((feature, idx) => ({
        vehicle_id: vehicleId,
        feature,
        display_order: idx,
      }));
      const { error: featErr } = await supabase
        .from("vehicle_features")
        .insert(rows);
      if (featErr) throw featErr;
    }

    // ===== Upload e inserir imagens =====
    // Coleta apenas campos newImage_*, garante que são imagens e limita a 10
    const imagesFiles = Array.from(formData.entries())
      .filter(([k]) => k.startsWith("newImage_"))
      .map(([, v]) => v as File)
      .filter((file) => file && file.size > 0 && file.type?.startsWith("image/"));

    // Remove duplicados simples por nome+size (evita uploads repetidos acidentais)
    const seen = new Set<string>();
    const uniqueFiles: File[] = [];
    for (const f of imagesFiles) {
      const key = `${f.name}__${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFiles.push(f);
      }
    }

    const filesCapped = uniqueFiles.slice(0, MAX_IMAGES);

    const imageRecords: Array<{
      vehicle_id: number;
      image_url: string;
      image_meta: any;
      display_order: number;
    }> = [];

    for (const file of filesCapped) {
      const uploaded = await uploadToStorage(file, vehicleId);
      imageRecords.push({
        vehicle_id: vehicleId,
        image_url: uploaded.url,
        image_meta: uploaded.meta,
        display_order: imageRecords.length, // sequência natural
      });
    }

    if (imageRecords.length > 0) {
      const { error: imgErr } = await supabase
        .from("vehicle_images")
        .insert(imageRecords);
      if (imgErr) throw imgErr;
    }

    return NextResponse.json({ success: true, id: vehicleId });
  } catch (error: any) {
    console.error("Erro ao criar veículo:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar veículo" },
      { status: 500 }
    );
  }
}

async function uploadToStorage(
  file: File,
  vehicleId: number
): Promise<{ url: string; meta: any }> {
  // preserva MIME/extensão real
  const mime = file.type || "application/octet-stream";

  const ext =
    mime === "image/webp"
      ? "webp"
      : mime === "image/jpeg"
      ? "jpg"
      : mime === "image/png"
      ? "png"
      : "bin"; // fallback seguro (quase nunca cai aqui, pois filtramos antes)

  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `vehicles/${vehicleId}/${filename}`;

  const { error: uploadErr } = await supabase.storage
    .from("vehicles-media")
    .upload(path, file, {
      contentType: mime,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadErr) throw uploadErr;

  const { data: pub } = supabase.storage
    .from("vehicles-media")
    .getPublicUrl(path);

  const meta = {
    bucket: "vehicles-media",
    path, // caminho exato para futuras exclusões/reordenações
    formats: [ext],
    sources: {
      original: {
        url: pub.publicUrl,
        size: file.size,
        format: ext,
      },
    },
    original: {
      mime,
      width: null,
      height: null,
    },
    updated_at: new Date().toISOString(),
    originalOnly: true,
  };

  return { url: pub.publicUrl, meta };
}
