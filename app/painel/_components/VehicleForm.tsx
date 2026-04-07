"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// importe do grid e do tipo (type-only import evita trazer valor)
import { ImagesSortableGrid, type UiImage } from "./ImagesSortableGrid";

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

type VehicleFormProps = {
  vehicle?: any;
};

export default function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Features
  const [features, setFeatures] = useState<string[]>(
    vehicle?.features?.map((f: any) => f.feature) || [""]
  );

  // Imagens (estado único: existentes + novas), já na ordem inicial vinda do banco
  const [uiImages, setUiImages] = useState<UiImage[]>(
    (vehicle?.images || []).map((img: any) => ({
      id: img?.image_meta?.path || img?.image_url || uid(),
      url: img?.image_url,
      meta: img?.image_meta,
      file: null,
      isNew: false,
    }))
  );

  function addFeature() {
    setFeatures([...features, ""]);
  }
  function removeFeature(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }
  function updateFeature(index: number, value: string) {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Features válidas
    const validFeatures = features.filter((f) => f.trim());
    formData.set("features", JSON.stringify(validFeatures));

    // Imagens EXISTENTES (sem file), NA ORDEM ATUAL DO GRID
    const existingImages = uiImages
      .filter((img) => !img.file)
      .filter((img) => !!img.url)
      .map((img) => ({ url: img.url, meta: img.meta ?? null }));
    formData.set("existingImages", JSON.stringify(existingImages));

    // Novas (arquivos) para upload direto
    const newFiles = uiImages.filter((img) => !!img.file).map((img) => img.file!);

    // helper p/ assinar + enviar cada arquivo direto ao Storage e montar payload compacto
    async function uploadNewImagesDirect(vehicleId: number) {
      const compactItems: Array<{ path: string; mime: string; size: number; ext: string }> = [];

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];

        // 1) pede URL assinada
        const sign = await fetch("/api/storage/sign-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vehicleId, mime: file.type }),
        }).then((r) => r.json());

        if (!sign?.url || !sign?.path) {
          throw new Error("Falha ao assinar upload de imagem.");
        }

        // 2) sobe direto pro Storage (PUT)
        const putRes = await fetch(sign.url, { method: "PUT", body: file });
        if (!putRes.ok) {
          throw new Error("Falha ao enviar imagem para o storage.");
        }

        // 3) adiciona item compacto para a rota append
        const ext =
          file.type === "image/webp"
            ? "webp"
            : file.type === "image/jpeg"
            ? "jpg"
            : file.type === "image/png"
            ? "png"
            : "bin";

        compactItems.push({
          path: sign.path,
          mime: file.type,
          size: file.size,
          ext,
        });
      }

      // 4) registra no banco (vehicle_images) na ordem após as existentes
      if (compactItems.length) {
        const resp = await fetch("/api/vehicles/images/append", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vehicleId, items: compactItems }),
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao salvar imagens no banco");
        }
      }
    }

    try {
      if (vehicle?.id) {
        // ====== EDITAR ======
        // Atualiza dados + ordem das existentes (sem subir arquivos)
        const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "PUT", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao salvar veículo");
        }

        // Sobe novas direto pro storage e registra metadados
        if (newFiles.length) {
          await uploadNewImagesDirect(vehicle.id);
        }
      } else {
        // ====== CRIAR ======
        // Cria o veículo sem enviar arquivos (a rota ignora ausência de newImage_*)
        const res = await fetch("/api/vehicles", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.id) {
          throw new Error(data.error || "Erro ao criar veículo");
        }
        const newId: number = data.id;

        // Agora sobe as novas imagens direto e registra metadados
        if (newFiles.length) {
          await uploadNewImagesDirect(newId);
        }
      }

      router.push("/painel");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar veículo");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full h-11 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "text-sm font-medium text-gray-700 mb-2 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Informações Básicas */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b">
          Informações Básicas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelClass}>Nome do Veículo *</label>
            <input
              name="name"
              defaultValue={vehicle?.name || ""}
              className={inputClass}
              required
              placeholder="Ex: Golf Comfortline 1.4 TSI"
            />
          </div>

          <div>
            <label className={labelClass}>Marca</label>
            <input
              name="brand"
              defaultValue={vehicle?.brand || ""}
              className={inputClass}
              placeholder="Ex: Volkswagen"
            />
          </div>

          <div>
            <label className={labelClass}>Preço</label>
            <input
              name="price"
              defaultValue={vehicle?.price || ""}
              className={inputClass}
              placeholder="Ex: R$ 72.900,00"
            />
          </div>

          <div>
            <label className={labelClass}>Ano</label>
            <input
              name="year"
              defaultValue={vehicle?.year || ""}
              className={inputClass}
              placeholder="Ex: 2015 ou 2014/2015"
            />
          </div>

          <div>
            <label className={labelClass}>Combustível</label>
            <select
              name="fuel"
              defaultValue={vehicle?.fuel || ""}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Álcool">Álcool</option>
              <option value="Flex">Flex</option>
              <option value="Diesel">Diesel</option>
              <option value="Elétrico">Elétrico</option>
              <option value="Híbrido">Híbrido</option>
              <option value="GNV">GNV</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Câmbio</label>
            <select
              name="transmission"
              defaultValue={vehicle?.transmission || ""}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="Manual">Manual</option>
              <option value="Automático">Automático</option>
              <option value="Automatizado">Automatizado</option>
              <option value="CVT">CVT</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Quilometragem</label>
            <input
              name="km"
              defaultValue={vehicle?.km || ""}
              className={inputClass}
              placeholder="Ex: 116.000 KM"
            />
          </div>

          <div>
            <label className={labelClass}>Cor</label>
            <input
              name="color"
              defaultValue={vehicle?.color || ""}
              className={inputClass}
              placeholder="Ex: Branco"
            />
          </div>

          <div>
            <label className={labelClass}>Placa</label>
            <input
              name="placa"
              defaultValue={vehicle?.placa || ""}
              className={inputClass}
              placeholder="Ex: ABC1D23"
            />
          </div>

          <div>
            <label className={labelClass}>Portas</label>
            <select
              name="doors"
              defaultValue={vehicle?.doors || ""}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="2">2 portas</option>
              <option value="4">4 portas</option>
              <option value="2/3">2/3 portas</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Badge/Etiqueta</label>
            <input
              name="badge"
              defaultValue={vehicle?.badge || ""}
              className={inputClass}
              placeholder="Ex: Seminovo, Destaque, Promoção"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            name="description"
            defaultValue={vehicle?.description || ""}
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva o veículo em detalhes..."
          />
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="available"
              defaultChecked={vehicle?.available ?? true}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Disponível para venda
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="spotlight"
              defaultChecked={vehicle?.spotlight ?? false}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Destaque na página inicial
            </span>
          </label>
        </div>
      </div>

      {/* Características */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b mb-4">
          Características do Veículo
        </h2>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                className={inputClass}
                placeholder="Ex: Ar condicionado, Direção elétrica, Airbags..."
              />
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            + Adicionar Característica
          </button>
        </div>
      </div>

      {/* Imagens (com drag & drop) */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b mb-4">
          Imagens (máximo 10) - Formato .webp recomendado
        </h2>

        <ImagesSortableGrid
          key={vehicle?.id ?? "novo"}
          initialImages={vehicle?.images || []}
          max={10}
          onChange={(items) => setUiImages(items)}
          onFilesPicked={() => {}}
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {submitting
            ? "Salvando..."
            : vehicle?.id
            ? "Salvar Alterações"
            : "Criar Veículo"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/painel")}
          disabled={submitting}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 disabled:opacity-50 font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
