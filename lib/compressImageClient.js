/**
 * Browser-only image compression before admin uploads.
 * Keeps uploads under nginx default limits (~1MB) without losing much quality.
 */

const DEFAULTS = {
  maxWidth: 1600,
  maxHeight: 1600,
  maxBytes: 900 * 1024,
  initialQuality: 0.82,
  minQuality: 0.5,
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function scaledSize(width, height, maxWidth, maxHeight) {
  let w = width;
  let h = height;
  const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress image"));
      },
      type,
      quality
    );
  });
}

/**
 * @param {File} file
 * @param {{ maxWidth?: number; maxHeight?: number; maxBytes?: number }} [options]
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, options = {}) {
  if (typeof window === "undefined" || !file) return file;

  const opts = { ...DEFAULTS, ...options };
  const skipTypes = ["image/gif", "image/svg+xml"];
  if (skipTypes.includes(file.type)) return file;

  // Already small enough for typical nginx limits
  if (file.size <= 700 * 1024 && file.type === "image/jpeg") {
    return file;
  }

  const img = await loadImageFromFile(file);
  const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight, opts.maxWidth, opts.maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const outputType = "image/jpeg";
  const baseName = (file.name || "image").replace(/\.[^.]+$/, "") || "image";

  let quality = opts.initialQuality;
  let blob = await canvasToBlob(canvas, outputType, quality);

  while (blob.size > opts.maxBytes && quality > opts.minQuality) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  if (blob.size >= file.size && file.size <= opts.maxBytes) {
    return file;
  }

  return new File([blob], `${baseName}.jpg`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse fetch response text — nginx 413 returns HTML, not JSON.
 */
export function parseUploadErrorResponse(text, status) {
  const raw = String(text || "").trim();
  if (status === 413 || raw.includes("413 Request Entity Too Large")) {
    return "Image is too large for the server. A smaller image was required — please try again or pick a smaller file.";
  }
  if (raw.startsWith("<") || raw.startsWith("<!DOCTYPE")) {
    return "Upload failed on the server. Try a smaller image or contact support.";
  }
  try {
    const json = JSON.parse(raw);
    return json.message || json.error || "Error saving service";
  } catch {
    return raw.slice(0, 200) || "Error saving service";
  }
}
