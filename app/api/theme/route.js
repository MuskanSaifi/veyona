import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ThemeSettings from "@/models/ThemeSettings";

function sanitizeColor(val, fallback) {
  const v = (val || "").toString().trim();
  // allow hex (#RGB, #RRGGBB, #RRGGBBAA) or rgb/rgba/hsl/hsla
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
  const isFn =
    /^(rgb|rgba|hsl|hsla)\(\s*[-0-9.,%\s]+\)$/.test(v.replace(/\s+/g, " "));
  return isHex || isFn ? v : fallback;
}

export async function GET() {
  await connectDB();
  const doc = await ThemeSettings.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const doc = await ThemeSettings.create({
    bgCream: sanitizeColor(body.bgCream, "#F5F0E6"),
    bgCharcoal: sanitizeColor(body.bgCharcoal, "#333333"),
    bgFooterDark: sanitizeColor(body.bgFooterDark, "#222222"),
    accentTerracotta: sanitizeColor(body.accentTerracotta, "#AD6E5E"),
    accentCoral: sanitizeColor(body.accentCoral, "#F28F79"),
    accentBrown: sanitizeColor(body.accentBrown, "#B59A7E"),
    textDark: sanitizeColor(body.textDark, "#222222"),
    textMuted: sanitizeColor(body.textMuted, "#5c5c5c"),
    borderLight: sanitizeColor(body.borderLight, "#e8e4dc"),
  });

  return NextResponse.json(doc);
}

export async function PUT(req) {
  await connectDB();
  const existing = await ThemeSettings.findOne().sort({ createdAt: -1 });
  if (!existing) {
    return NextResponse.json(
      { error: "No theme found. Create one first." },
      { status: 404 }
    );
  }

  const body = await req.json();
  const update = {};

  if (body.bgCream !== undefined) update.bgCream = sanitizeColor(body.bgCream, existing.bgCream);
  if (body.bgCharcoal !== undefined) update.bgCharcoal = sanitizeColor(body.bgCharcoal, existing.bgCharcoal);
  if (body.bgFooterDark !== undefined) update.bgFooterDark = sanitizeColor(body.bgFooterDark, existing.bgFooterDark);
  if (body.accentTerracotta !== undefined) update.accentTerracotta = sanitizeColor(body.accentTerracotta, existing.accentTerracotta);
  if (body.accentCoral !== undefined) update.accentCoral = sanitizeColor(body.accentCoral, existing.accentCoral);
  if (body.accentBrown !== undefined) update.accentBrown = sanitizeColor(body.accentBrown, existing.accentBrown);
  if (body.textDark !== undefined) update.textDark = sanitizeColor(body.textDark, existing.textDark);
  if (body.textMuted !== undefined) update.textMuted = sanitizeColor(body.textMuted, existing.textMuted);
  if (body.borderLight !== undefined) update.borderLight = sanitizeColor(body.borderLight, existing.borderLight);

  const doc = await ThemeSettings.findByIdAndUpdate(existing._id, update, {
    new: true,
  });

  return NextResponse.json(doc);
}

