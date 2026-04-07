"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { thumbUrlFromMeta } from "@/utils/thumb";

/** ===== Tipos expostos ===== */
export type UiImage = {
  id: string;          // id único p/ DnD (use path da meta ou a própria URL)
  url: string;         // image_url público ou blob: para preview
  meta?: any;          // image_meta (se existir)
  file?: File | null;  // se for imagem nova (ainda não enviada)
  isNew?: boolean;     // flag auxiliar
};

const PLACEHOLDER = "/images/placeholder.webp";

// utilitário p/ id estável
const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

/** Thumb ordenável */
function SortableThumb({
  item,
  index,
  onRemove,
}: {
  item: UiImage;
  index: number;
  onRemove?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    cursor: "grab",
  } as React.CSSProperties;

  const isLocalPreview = !!item.file; // blob: (novo upload)

  // para imagens persistidas no banco, usamos a thumb via render API (com fallback para a URL original)
  const remoteSrc = thumbUrlFromMeta(item.meta, item.url || PLACEHOLDER);

  // estado local para tratar fallback de erro no <Image>
  const [displaySrc, setDisplaySrc] = useState<string>(
    isLocalPreview ? (item.url || PLACEHOLDER) : (remoteSrc || PLACEHOLDER)
  );

  useEffect(() => {
    // se o item mudar (ex.: reordenação/replace), recalcula o src
    const next = isLocalPreview ? (item.url || PLACEHOLDER) : (thumbUrlFromMeta(item.meta, item.url || PLACEHOLDER));
    setDisplaySrc(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.url, item.meta, isLocalPreview]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative rounded-md overflow-hidden border bg-white"
    >
      {isLocalPreview ? (
        // blob local: use <img> simples (Next/Image não precisa aqui)
        <img
          src={displaySrc}
          alt={`Imagem ${index + 1}`}
          width={240}
          height={160}
          className="w-full h-40 object-cover"
          draggable={false}
          onError={() => setDisplaySrc(PLACEHOLDER)}
        />
      ) : (
        // imagem persistida: Next/Image com miniatura do Supabase render
        <Image
          key={displaySrc}                 // força recriar quando o src muda
          src={displaySrc || PLACEHOLDER}
          alt={`Imagem ${index + 1}`}
          width={240}
          height={160}
          className="w-full h-40 object-cover"
          draggable={false}
          unoptimized                      // evita inconsistências em domínios externos
          onError={() => {
            // se a thumb falhar, tenta a URL original; se também falhar, usa placeholder
            const fallback = item.url || PLACEHOLDER;
            if (displaySrc !== fallback) setDisplaySrc(fallback);
            else setDisplaySrc(PLACEHOLDER);
          }}
        />
      )}

      <span className="absolute left-1.5 bottom-1.5 inline-flex h-6 w-6 items-center justify-center rounded bg-black/70 text-white text-xs">
        {index + 1}
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white/90 text-black text-xs font-bold"
          title="Remover"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** Grid ordenável (drag & drop) */
export function ImagesSortableGrid({
  initialImages,
  onChange,
  onFilesPicked,
  max = 10,
}: {
  initialImages: { image_url: string; image_meta?: any }[];
  onChange: (items: UiImage[]) => void;
  onFilesPicked: (files: File[]) => void;
  max?: number;
}) {
  const [items, setItems] = useState<UiImage[]>([]);
  const hydratedRef = useRef(false); // evita re-hidratar a cada re-render do pai

  // Hidrata apenas UMA vez a partir de initialImages.
  useEffect(() => {
    if (hydratedRef.current) return;
    const mapped = (initialImages || []).map((img) => ({
      id: (img.image_meta?.path as string) || img.image_url || uid(),
      url: img.image_url,
      meta: img.image_meta,
      file: null,
      isNew: false,
    }));
    setItems(mapped);
    hydratedRef.current = true;
  }, [initialImages]);

  // revoke objectURLs ao desmontar (evita memory leak)
  useEffect(() => {
    return () => {
      items.forEach((i) => {
        if (i.file && i.url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(i.url);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onChange(reordered);
  };

  const handleRemove = (id: string) => {
    const toRemove = items.find((i) => i.id === id);
    if (toRemove?.file && toRemove.url?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(toRemove.url);
      } catch {}
    }
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    onChange(next);
  };

  const canAdd = items.length < max;

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item, idx) => (
              <SortableThumb
                key={item.id}
                item={item}
                index={idx}
                onRemove={handleRemove}
              />
            ))}

            {canAdd && (
              <label className="border-2 border-dashed rounded-md h-40 flex items-center justify-center text-sm text-gray-500 cursor-pointer">
                <input
                  type="file"
                  accept="image/webp,image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.currentTarget.files || []);
                    if (!files.length) return;

                    onFilesPicked(files);

                    const toAdd: UiImage[] = [];
                    for (const f of files.slice(0, max - items.length)) {
                      const blobUrl = URL.createObjectURL(f);
                      toAdd.push({
                        id: uid(),
                        url: blobUrl,
                        meta: undefined,
                        file: f,
                        isNew: true,
                      });
                    }

                    const next = [...items, ...toAdd];
                    setItems(next);
                    onChange(next);

                    // permite selecionar os mesmos arquivos novamente depois
                    e.currentTarget.value = "";
                  }}
                />
                Clique para adicionar imagens
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="text-xs text-gray-500">
        {items.length} de {max} imagens • Formatos: JPG, PNG, WEBP
      </div>
    </div>
  );
}
