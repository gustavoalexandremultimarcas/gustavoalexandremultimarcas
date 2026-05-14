type ImageVariantName = "card" | "tile" | "gallery" | "detail";

type ImageVariantConfig = {
  width: number;
  height: number;
  quality: number;
};

export type VehicleImageMeta = {
  bucket: string;
  path: string;
  formats: string[];
  sources: {
    original: {
      url: string;
      size: number | null;
      format: string;
    };
  };
  original: {
    mime: string;
    width: number | null;
    height: number | null;
  };
  variants: Record<ImageVariantName, string>;
  updated_at: string;
  originalOnly: boolean;
};

const VARIANTS: Record<ImageVariantName, ImageVariantConfig> = {
  card: { width: 640, height: 480, quality: 72 },
  tile: { width: 240, height: 180, quality: 65 },
  gallery: { width: 1280, height: 960, quality: 82 },
  detail: { width: 960, height: 720, quality: 78 },
};

function getSupabaseBaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") || "";
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function parseStoragePathFromPublicUrl(publicUrl?: string | null) {
  if (!publicUrl) return null;

  const match = publicUrl.match(
    /\/storage\/v1\/object\/public\/([^/?#]+\/.+?)(?:[?#].*)?$/
  );

  return match?.[1] ?? null;
}

export function getRenderUrlFromPath(
  path: string,
  variant: ImageVariantName = "card"
) {
  const base = getSupabaseBaseUrl();
  const cfg = VARIANTS[variant];
  if (!base || !path) return null;

  return `${base}/storage/v1/render/image/public/vehicles-media/${encodePath(
    path
  )}?width=${cfg.width}&height=${cfg.height}&resize=cover&quality=${cfg.quality}`;
}

export function getRenderUrlFromPublicUrl(
  publicUrl?: string | null,
  variant: ImageVariantName = "card"
) {
  const path = parseStoragePathFromPublicUrl(publicUrl);
  if (!path) return publicUrl || null;
  return getRenderUrlFromPath(path.replace(/^vehicles-media\//, ""), variant);
}

export function buildVehicleImageMeta(input: {
  path: string;
  publicUrl: string;
  mime: string;
  size: number | null;
  format: string;
  width?: number | null;
  height?: number | null;
}): VehicleImageMeta {
  const variants: Record<ImageVariantName, string> = {
    card: getRenderUrlFromPath(input.path, "card") || input.publicUrl,
    tile: getRenderUrlFromPath(input.path, "tile") || input.publicUrl,
    gallery: getRenderUrlFromPath(input.path, "gallery") || input.publicUrl,
    detail: getRenderUrlFromPath(input.path, "detail") || input.publicUrl,
  };

  return {
    bucket: "vehicles-media",
    path: input.path,
    formats: [input.format],
    sources: {
      original: {
        url: input.publicUrl,
        size: input.size ?? null,
        format: input.format,
      },
    },
    original: {
      mime: input.mime,
      width: input.width ?? null,
      height: input.height ?? null,
    },
    variants,
    updated_at: new Date().toISOString(),
    originalOnly: false,
  };
}

export function getVehicleImageOriginal(
  meta?: Partial<VehicleImageMeta> | null,
  fallback?: string | null
) {
  return meta?.sources?.original?.url || fallback || "/images/placeholder.webp";
}

export function getVehicleImageVariant(
  meta?: Partial<VehicleImageMeta> | null,
  variant: ImageVariantName = "card",
  fallback?: string | null
) {
  return (
    meta?.variants?.[variant] ||
    getRenderUrlFromPath(meta?.path || "", variant) ||
    getRenderUrlFromPublicUrl(fallback, variant) ||
    fallback ||
    "/images/placeholder.webp"
  );
}
