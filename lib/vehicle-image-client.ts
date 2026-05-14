const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const WEBP_QUALITY = 0.8;

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

function getTargetSize(width: number, height: number) {
  const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export async function compressVehicleImageInBrowser(file: File) {
  if (!file.type.startsWith("image/")) return file;

  const img = await loadImageFromFile(file);
  const target = getTargetSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, target.width, target.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  if (!blob) return file;

  const compressed = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, "") + ".webp",
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );

  const resized =
    target.width !== img.naturalWidth || target.height !== img.naturalHeight;

  if (!resized && compressed.size >= file.size) {
    return file;
  }

  return compressed;
}
