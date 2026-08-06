export type SquareCrop = { x: number; y: number; size: number };

export function getSquareCrop(width: number, height: number, zoom: number, offsetX: number, offsetY: number): SquareCrop {
  const size = Math.min(width, height) / zoom;
  return {
    x: (width - size) * ((offsetX + 100) / 200),
    y: (height - size) * ((offsetY + 100) / 200),
    size,
  };
}

export async function cropSquareImage(image: HTMLImageElement, fileName: string, zoom: number, offsetX: number, offsetY: number) {
  const crop = getSquareCrop(image.naturalWidth, image.naturalHeight, zoom, offsetX, offsetY);
  const outputSize = Math.min(1080, Math.max(1, Math.round(crop.size)));
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas를 초기화할 수 없습니다.");
  context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, outputSize, outputSize);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (result) => result ? resolve(result) : reject(new Error("이미지를 자르지 못했습니다.")),
    "image/webp",
    0.88,
  ));
  return new File([blob], `${fileName.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}
