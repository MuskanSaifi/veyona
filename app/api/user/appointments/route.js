import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { getCustomerIdsForUser } from "@/lib/customerLookup";

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

    const customerIds = await getCustomerIdsForUser(user);
    if (customerIds.length === 0) return NextResponse.json([]);

    // Get all appointments for this customer
    const appointments = await Appointment.find({ customer: { $in: customerIds } })
      .populate("salon")
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

