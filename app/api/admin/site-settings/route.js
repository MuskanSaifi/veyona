import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { requireAdmin } from "@/lib/serviceTrackingAuth";

/**
 * Admin-only CRUD for SiteSettings.
 *
 * GET  → returns the latest doc (or defaults if none exists yet).
 * PUT  → upserts the singleton doc with the provided fields.
 */
export async function GET(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const doc = await SiteSettings.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(
    doc || {
      happyCustomersEnabled: true,
      happyCustomersCount: 0,
      happyCustomersLabel: "Happy Customers",
      happyCustomersSuffix: "+",
    }
  );
}

export async function PUT(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const update = {};
  if (body.happyCustomersEnabled !== undefined) {
    update.happyCustomersEnabled = !!body.happyCustomersEnabled;
  }
  if (body.happyCustomersCount !== undefined) {
    const n = Number(body.happyCustomersCount);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json(
        { message: "happyCustomersCount must be a non-negative number" },
        { status: 400 }
      );
    }
    update.happyCustomersCount = Math.floor(n);
  }
  if (body.happyCustomersLabel !== undefined) {
    update.happyCustomersLabel = String(body.happyCustomersLabel).trim().slice(0, 80);
  }
  if (body.happyCustomersSuffix !== undefined) {
    update.happyCustomersSuffix = String(body.happyCustomersSuffix).trim().slice(0, 8);
  }

  const existing = await SiteSettings.findOne().sort({ createdAt: -1 });
  const doc = existing
    ? await SiteSettings.findByIdAndUpdate(existing._id, update, { new: true })
    : await SiteSettings.create(update);

  return NextResponse.json(doc);
}
