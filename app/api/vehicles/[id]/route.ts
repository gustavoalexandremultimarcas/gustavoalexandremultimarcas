import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const vehicleId = parseInt(id);
    const formData = await request.formData();

    // Dados do veículo
    const vehicleData = {
      name: (formData.get("name") as string),
      brand: (formData.get("brand") as string) || null,
      price: (formData.get("price") as string) || null,
      year: (formData.get("year") as string) || null,
      fuel: (formData.get("fuel") as string) || null,
      transmission: (formData.get("transmission") as string) || null,
      km: (formData.get("km") as string) || null,
      color: (formData.get("color") as string) || null,
      placa: (formData.get("placa") as string) || null,
      doors: (formData.get("doors") as string) || null,
      badge: (formData.get("badge") as string) || null,
      description: (formData.get("description") as string) || null,
      spotlight: formData.get("spotlight") === "on",
      available: formData.get("available") === "on",
      updated_at: new Date().toISOString(),
    };

    // Atualizar veículo
    const { error: updateError } = await supabase
      .from("vehicles")
      .update(vehicleData)
      .eq("id", vehicleId);

    if (updateError) throw updateError;

    // ===== FEATURES =====
    await supabase.from("vehicle_features").delete().eq("vehicle_id", vehicleId);

    const features = JSON.parse((formData.get("features") as string) || "[]");
    if (features.length > 0) {
      await supabase.from("vehicle_features").insert(
        features.map((feature: string, idx: number) => ({
          vehicle_id: vehicleId,
          feature,
          display_order: idx,
        }))
      );
    }

    // ===== IMAGENS =====
    // 1) Buscar imagens antigas (para comparar e remover apenas o que saiu)
    const { data: oldImages, error: oldImgsErr } = await supabase
      .from("vehicle_images")
      .select("image_url, image_meta, display_order")
      .eq("vehicle_id", vehicleId)
      .order("display_order");

    if (oldImgsErr) throw oldImgsErr;

    // 2) Quais imagens o formulário está mantendo (e em qual ordem)
    const existingImages: Array<{ url: string; meta: any }> = JSON.parse(
      (formData.get("existingImages") as string) || "[]"
    );

    // Função de chave estável para comparar (prioriza meta.path; cai para url)
    const keyOf = (img: { url: string; meta?: any }) =>
      (img?.meta?.path as string) || img.url;

    const keptKeys = new Set(existingImages.map(keyOf));

    // 3) Descobrir o que excluir do Storage (somente o que saiu)
    const toDeletePaths: string[] = [];
    for (const img of oldImages || []) {
      const key = keyOf({ url: img.image_url, meta: img.image_meta });
      if (!keptKeys.has(key)) {
        const meta = img?.image_meta || {};
        const path =
          meta?.path ||
          (meta?.folder ? `${meta.folder}/original.webp` : null);
        if (path) toDeletePaths.push(path);
      }
    }

    if (toDeletePaths.length) {
      try {
        await supabase.storage.from("vehicles-media").remove(toDeletePaths);
      } catch (e) {
        console.error("Erro ao remover imagens do storage:", e);
      }
    }

    // 4) Reescrever a tabela com a ordem final:
    //    primeiro as existentes (na ordem recebida), depois as novas
    await supabase.from("vehicle_images").delete().eq("vehicle_id", vehicleId);

    if (existingImages.length > 0) {
      await supabase.from("vehicle_images").insert(
        existingImages.map((img, idx) => ({
          vehicle_id: vehicleId,
          image_url: img.url,
          image_meta: img.meta,
          display_order: idx,
        }))
      );
    }

    // 5) Upload de novas imagens (após as existentes)
    const newImageRecords: any[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("newImage_")) {
        const file = value as File;
        const uploaded = await uploadToStorage(file, vehicleId);
        newImageRecords.push({
          vehicle_id: vehicleId,
          image_url: uploaded.url,
          image_meta: uploaded.meta,
          display_order: existingImages.length + newImageRecords.length,
        });
      }
    }

    if (newImageRecords.length > 0) {
      await supabase.from("vehicle_images").insert(newImageRecords);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao atualizar veículo:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar veículo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const vehicleId = parseInt(id);

    // Deletar imagens do storage (por path, com fallback)
    const { data: images } = await supabase
      .from("vehicle_images")
      .select("image_meta")
      .eq("vehicle_id", vehicleId);

    for (const img of images || []) {
      try {
        const meta = img?.image_meta || {};
        const path =
          meta?.path ||
          (meta?.folder ? `${meta.folder}/original.webp` : null);

        if (path) {
          await supabase.storage.from("vehicles-media").remove([path]);
        }
      } catch (e) {
        console.error("Erro ao deletar imagem do storage:", e);
      }
    }

    // Deletar veículo (cascade vai deletar features e images)
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir veículo:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao excluir veículo" },
      { status: 500 }
    );
  }
}

async function uploadToStorage(
  file: File,
  vehicleId: number
): Promise<{ url: string; meta: any }> {
  const filename = `${crypto.randomUUID()}.webp`;
  const path = `vehicles/${vehicleId}/${filename}`;

  const { error } = await supabase.storage
    .from("vehicles-media")
    .upload(path, file, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data: pub } = supabase.storage
    .from("vehicles-media")
    .getPublicUrl(path);

  const meta = {
    bucket: "vehicles-media",
    path, // caminho exato p/ futuras exclusões
    formats: ["webp"],
    sources: {
      original: {
        url: pub.publicUrl,
        size: file.size,
        format: "webp",
      },
    },
    original: {
      mime: "image/webp",
      width: null,
      height: null,
    },
    updated_at: new Date().toISOString(),
    originalOnly: true,
  };

  return { url: pub.publicUrl, meta };
}
