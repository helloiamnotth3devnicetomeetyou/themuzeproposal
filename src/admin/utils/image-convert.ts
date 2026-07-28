/**
 * Converts a raster image File to WebP format using the browser Canvas API.
 *
 * SVG files are returned as-is (Canvas rasterises SVGs without preserving
 * vector data, which is not what we want for logo assets).
 *
 * @param file     The original image File selected by the user.
 * @param quality  WebP quality [0, 1]. Defaults to 0.88 — visually lossless
 *                 for most photography while halving typical JPEG sizes.
 * @returns        A new File whose type is `image/webp` and whose name ends
 *                 with `.webp`, or the original file unchanged for SVGs.
 */
export async function toWebP(file: File, quality = 0.88): Promise<File> {
  // Pass SVGs through untouched — they are vector, not raster.
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Already WebP — skip re-encoding.
  if (file.type === "image/webp") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas를 초기화할 수 없습니다.");
    context.drawImage(image, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("WebP 변환에 실패했습니다."));
        },
        "image/webp",
        quality,
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
