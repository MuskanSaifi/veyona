import cloudinary from "@/lib/cloudinary";

export function assertCloudinaryConfigured() {
  const missing = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME?.trim()) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!process.env.CLOUDINARY_API_KEY?.trim()) missing.push("CLOUDINARY_API_KEY");
  if (!process.env.CLOUDINARY_API_SECRET?.trim()) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length) {
    throw new Error(
      `Cloudinary is not configured on this server (${missing.join(", ")}). Add credentials to .env and restart.`
    );
  }
}

/**
 * @param {Buffer} buffer
 * @param {string} [folder]
 */
export async function uploadImageBuffer(buffer, folder = "uploads") {
  assertCloudinaryConfigured();
  if (!buffer?.length) {
    throw new Error("Empty image file");
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary upload returned no image URL"));
        }
        resolve(result);
      }
    ).end(buffer);
  });
}

export function isRemoteImageUrl(url) {
  return typeof url === "string" && /^https?:\/\/.+/i.test(url.trim());
}
