import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import Customer from "@/models/Customer";
import Salon from "@/models/Salon";
import Employee from "@/models/Employee";
import Service from "@/models/Service";
import jwt from "jsonwebtoken";

function phoneVariants(input) {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const variants = new Set([raw, digits, last10]);
  if (last10 && last10.length === 10) {
    variants.add(`+91${last10}`);
    variants.add(`91${last10}`);
  }
  return Array.from(variants).filter(Boolean);
}

export async function GET(req) {
  await connectDB();

  try {
    const token = req.cookies.get("userToken")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "user") {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Find customer by phone number
    const phones = phoneVariants(user.phone);
    const customers = await Customer.find({ phone: { $in: phones } }).select("_id").lean();
    const customerIds = customers.map((c) => c._id);
    if (customerIds.length === 0) return NextResponse.json([]);

    // Get all appointments for this customer
    const appointments = await Appointment.find({ customer: { $in: customerIds } })
      .populate("salon")
      .populate("employee")
      .populate({
        path: "service",
        populate: [{ path: "clinic", select: "name address city state pincode" }],
      })
      .populate({
        path: "services.service",
        select: "name image duration price isVideoConsultation category clinic clinicAddress",
        populate: [{ path: "clinic", select: "name address city state pincode" }],
      })
      .populate("customer")
      .sort({ date: -1, time: -1 });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return NextResponse.json(
      { message: error.message || "Error fetching appointments" },
      { status: 500 }
    );
  }
}

