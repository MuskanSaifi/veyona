import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import TrustSignalsSection from "@/models/TrustSignalsSection";

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function uploadFileToCloudinary(file, folder = "trust-signals") {
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }).end(buffer);
  });
  return upload?.secure_url || "";
}

export async function GET() {
  await connectDB();
  const doc = await TrustSignalsSection.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export async function PUT(req) {
  await connectDB();
  try {
    const formData = await req.formData();

    const kicker = (formData.get("kicker") || "").toString().trim();
    const title = (formData.get("title") || "").toString().trim();
    const description = (formData.get("description") || "").toString().trim();
    const trustPoints = safeParseJson(formData.get("trustPoints"), []);
    const quickReviews = safeParseJson(formData.get("quickReviews"), []);
    const beforeAfterItems = safeParseJson(formData.get("beforeAfterItems"), []);

    const existing = await TrustSignalsSection.findOne().sort({ createdAt: -1 });
    const mergedBeforeAfter = Array.isArray(beforeAfterItems) ? beforeAfterItems : [];

    for (let i = 0; i < mergedBeforeAfter.length; i += 1) {
      const beforeFile = formData.get(`beforeImageFile_${i}`);
      const afterFile = formData.get(`afterImageFile_${i}`);

      if (beforeFile && typeof beforeFile === "object" && beforeFile.size > 0) {
        mergedBeforeAfter[i].beforeImage = await uploadFileToCloudinary(beforeFile, "trust-signals/before");
      } else if (!mergedBeforeAfter[i].beforeImage && existing?.beforeAfterItems?.[i]?.beforeImage) {
        mergedBeforeAfter[i].beforeImage = existing.beforeAfterItems[i].beforeImage;
      }

      if (afterFile && typeof afterFile === "object" && afterFile.size > 0) {
        mergedBeforeAfter[i].afterImage = await uploadFileToCloudinary(afterFile, "trust-signals/after");
      } else if (!mergedBeforeAfter[i].afterImage && existing?.beforeAfterItems?.[i]?.afterImage) {
        mergedBeforeAfter[i].afterImage = existing.beforeAfterItems[i].afterImage;
      }
    }

    const payload = {
      kicker: kicker || "Trust & Safety",
      title: title || "Why Customers Trust Veyona for Home Services",
      description: description || "",
      trustPoints: (Array.isArray(trustPoints) ? trustPoints : []).filter(
        (item) => item?.title || item?.text
      ),
      quickReviews: (Array.isArray(quickReviews) ? quickReviews : []).filter(
        (item) => item?.name || item?.review
      ),
      beforeAfterItems: mergedBeforeAfter.filter(
        (item) => item?.beforeImage || item?.afterImage || item?.beforeLabel || item?.afterLabel
      ),
      active: true,
    };

    const doc = existing
      ? await TrustSignalsSection.findByIdAndUpdate(existing._id, payload, { new: true })
      : await TrustSignalsSection.create(payload);

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update trust section" },
      { status: 500 }
    );
  }
}
