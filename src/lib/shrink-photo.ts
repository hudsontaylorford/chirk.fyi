// Shrinks a photo in the browser before upload: longest side 1600px, JPEG at 0.8 (a few hundred KB).
// Decoding through <img> keeps the photo's orientation and reads HEIC on iPhone Safari.
// Canvas output drops the photo's hidden data (GPS location included).
const MAX_SIDE = 1600;
const MAX_INPUT = 25 * 1024 * 1024;

export async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.size > MAX_INPUT) throw new Error("That photo is too big (over 25 MB). Try a smaller one.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.8));
    if (blob?.type === "image/jpeg") return blob;
  } catch {
    // fall through
  } finally {
    URL.revokeObjectURL(url);
  }
  // Couldn't read it here (e.g. a HEIC in Chrome): a small JPEG can still go up as it is.
  if (file.type === "image/jpeg" && file.size <= 2 * 1024 * 1024) return file;
  throw new Error("Couldn't read this photo. Try a JPEG, or take a screenshot of it and upload that.");
}
