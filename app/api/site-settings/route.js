import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";

/** Public header total = this base plus every appointment in the database. */
const APPOINTMENT_DISPLAY_BASE = 10000;

/**
 * GET /api/site-settings
 * Public. Header strip shows 10,000 + total appointments.
 */
export async function GET() {
  await connectDB();
  const totalAppointments = await Appointment.countDocuments();

  const data = {
    happyCustomersEnabled: true,
    happyCustomersCount: APPOINTMENT_DISPLAY_BASE + totalAppointments,
    happyCustomersLabel: "Total Appointments",
    happyCustomersSuffix: "",
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
