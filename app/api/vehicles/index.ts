// páginas API aceitam sizeLimit (ex.: 30mb)
export const config = {
  api: { bodyParser: false }, // deixa o formidable fazer o parse do multipart
};

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_IMAGES = 10;
const toNull = (v: unknown) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session) return res.status(401).json({ error: "Não autorizado" });

  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    // parse multipart com formidable
    const formidable = (await import("formidable")).default;
    const form = formidable({ multiples: true, maxFileSize: 30 * 1024 * 1024 });

    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    });

    const vehicleData = {
      name: (fields.name as string)?.trim(),
      brand: toNull(fields.brand),
      price: toNull(fields.price),
      year: toNull(fields.year),
      fuel: toNull(fields.fuel),
      transmission: toNull(fields.transmission),
      km: toNull(fields.km),
      color: toNull(fields.color),
      placa: toNull(fields.placa),
      doors: toNull(fields.doors),
      badge: toNull(fields.badge),
      description: toNull(fields.description),
      spotlight: fields.spotlight === "on",
      available: fields.available === "on",
      updated_at: new Date().toISOString(),
    };
    if (!vehicleData.name) return res.status(400).json({ error: "Nome do veículo é obrigatório." });

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .insert([vehicleData])
      .select()
      .single();
    if (vehicleError) throw vehicleError;

    const vehicleId = vehicle.id as number;

    // Features
    let features: string[] = [];
    try {
      features = JSON.parse((fields.features as string) || "[]");
    } catch {}
    const clean = Array.from(new Set((features || []).map((f) => (f ?? "").toString().trim()).filter(Boolean)));
    if (clean.length) {
      const rows = clean.map((feature, idx) => ({ vehicle_id: vehicleId, feature, display_order: idx }));
      const { error } = await supabase.from("vehicle_features").insert(rows);
      if (error) throw error;
    }

    // Imagens
    const picked = Object.entries(files)
      .filter(([k]) => k.startsWith("newImage_"))
      .map(([, v]) => (Array.isArray(v) ? v[0] : v))
      .slice(0, MAX_IMAGES);

    const imageRecords: any[] = [];
    for (const f of picked) {
      const mime = f.mimetype || "application/octet-stream";
      const ext =
        mime === "image/webp" ? "webp" : mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "bin";
      const path = `vehicles/${vehicleId}/${crypto.randomUUID()}.${ext}`;

      const fileBuffer = await (await import("node:fs/promises")).readFile(f.filepath);
      const { error: upErr } = await supabase.storage
        .from("vehicles-media")
        .upload(path, fileBuffer, { contentType: mime, upsert: false, cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("vehicles-media").getPublicUrl(path);
      imageRecords.push({
        vehicle_id: vehicleId,
        image_url: pub.publicUrl,
        image_meta: {
          bucket: "vehicles-media",
          path,
          formats: [ext],
          sources: { original: { url: pub.publicUrl, size: f.size, format: ext } },
          original: { mime, width: null, height: null },
          updated_at: new Date().toISOString(),
          originalOnly: true,
        },
        display_order: imageRecords.length,
      });
    }

    if (imageRecords.length) {
      const { error } = await supabase.from("vehicle_images").insert(imageRecords);
      if (error) throw error;
    }

    return res.status(200).json({ success: true, id: vehicleId });
  } catch (e: any) {
    console.error("Erro ao criar veículo:", e);
    return res.status(500).json({ error: e?.message || "Erro ao criar veículo" });
  }
}
