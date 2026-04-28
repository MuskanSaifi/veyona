import { NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

/**
 * GET /api/whatsapp/test?phone=XXXXXXXXXX&template=transactional_booking_received
 * Sends a live template message for quick Interakt/API verification.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone =
      searchParams.get("phone") ||
      process.env.ADMIN_WHATSAPP_PHONE ||
      process.env.ADMIN_PHONE;
    const template =
      searchParams.get("template") ||
      process.env.INTERAKT_TEMPLATE_BOOKING_RECEIVED ||
      "transactional_booking_received";

    if (!phone) {
      return NextResponse.json(
        { message: "Missing phone. Pass ?phone=XXXXXXXXXX or set ADMIN_WHATSAPP_PHONE." },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate(phone, template, ["Test User", "Haircut"]);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "WhatsApp send failed",
          phone,
          template,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test template sent",
      phone,
      template,
      bodyValues: ["Test User", "Haircut"],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
