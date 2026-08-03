const MAX_DIM = 2400;
const JPEG_QUALITY = 0.7;

export function isHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
}

export async function compressImage(file: File): Promise<File> {
  return (await compressImageSizes(file, [MAX_DIM]))[0];
}

export async function compressImageSizes(file: File, sizes: number[]): Promise<File[]> {
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  const source = isHeic(file) ? await heicToJpeg(file) : file;
  const out: File[] = [];
  for (const size of sizes) {
    const blob = await canvasJpeg(source, size);
    out.push(new File([blob], name, { type: "image/jpeg" }));
  }
  return out;
}

async function heicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  return Array.isArray(out) ? out[0] : out;
}

function canvasJpeg(source: Blob, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("JPEG encode failed"))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}
