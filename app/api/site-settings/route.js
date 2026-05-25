import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

/**
 * GET /api/site-settings
 * Public, cached. Used by the site header (HappyCustomersBar).
 */
export async function GET() {
  await connectDB();
  const doc = await SiteSettings.findOne().sort({ createdAt: -1 }).lean();

  const data = {
    happyCustomersEnabled: doc?.happyCustomersEnabled ?? false,
    happyCustomersCount: doc?.happyCustomersCount ?? 0,
    happyCustomersLabel: doc?.happyCustomersLabel ?? "Happy Customers",
    happyCustomersSuffix: doc?.happyCustomersSuffix ?? "+",
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
