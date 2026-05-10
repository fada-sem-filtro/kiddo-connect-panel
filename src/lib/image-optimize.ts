// Client-side image optimization: resize + convert to WebP.
// Falls back to original file if conversion fails or not supported.

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1
  mime?: 'image/webp' | 'image/jpeg';
}

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<File> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82, mime = 'image/webp' } = opts;

  // Skip SVGs / GIFs / already-small images we cannot/shouldn't recompress.
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mime, quality)
    );
    if (!blob) return file;

    // If WebP version somehow ended bigger, keep original.
    if (blob.size >= file.size && file.type === mime) return file;

    const ext = mime === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: mime });
  } catch {
    return file;
  }
}

export function suggestAltFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
