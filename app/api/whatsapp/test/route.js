import { NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getTemplateEnv } from "@/lib/whatsappEnv";
import { KRAYA_VARS, krayaVars } from "@/lib/krayaTemplateVars";

/**
 * GET /api/whatsapp/test?phone=XXXXXXXXXX&template=transactional_booking_received
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
      getTemplateEnv("BOOKING_RECEIVED", "transactional_booking_received");

    if (!phone) {
      return NextResponse.json(
        {
          message:
            "Missing phone. Pass ?phone=XXXXXXXXXX or set ADMIN_WHATSAPP_PHONE.",
        },
        { status: 400 }
      );
    }

    const vars = krayaVars({
      [KRAYA_VARS.LEAD_NAME]: "Test User",
      [KRAYA_VARS.SERVICE]: "Haircut",
    });
    const result = await sendWhatsAppTemplate(phone, template, vars);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "WhatsApp send failed",
          phone,
          template,
          provider: "kraya",
          variables: vars,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test template sent via Kraya",
      phone,
      template,
      provider: "kraya",
      variables: vars,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
