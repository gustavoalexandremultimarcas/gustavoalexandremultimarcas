// utils/thumb.ts
export function thumbUrlFromMeta(meta?: any, fallback?: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const path = meta?.path as string | undefined;
  if (base && path) {
    // render API do Supabase
    return `${base}/storage/v1/render/image/public/vehicles-media/${encodeURIComponent(
      path
    )}?width=320&quality=70`;
  }
  return fallback || "/images/placeholder.webp";
}
