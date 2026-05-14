import {
  getVehicleImageOriginal,
  getVehicleImageVariant,
  type VehicleImageMeta,
} from "@/lib/vehicle-images";

export function thumbUrlFromMeta(
  meta?: Partial<VehicleImageMeta> | null,
  fallback?: string,
  variant: "card" | "tile" | "gallery" | "detail" = "card"
) {
  return getVehicleImageVariant(meta, variant, fallback);
}

export function originalUrlFromMeta(
  meta?: Partial<VehicleImageMeta> | null,
  fallback?: string
) {
  return getVehicleImageOriginal(meta, fallback);
}
