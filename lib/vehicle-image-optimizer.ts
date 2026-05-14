import sharp from "sharp";

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const WEBP_QUALITY = 80;

export type OptimizedVehicleImage = {
  buffer: Buffer;
  mime: "image/webp";
  ext: "webp";
  size: number;
  width: number | null;
  height: number | null;
};

export async function optimizeVehicleImage(
  file: File
): Promise<OptimizedVehicleImage> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const { data, info } = await sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    mime: "image/webp",
    ext: "webp",
    size: info.size,
    width: info.width ?? null,
    height: info.height ?? null,
  };
}
