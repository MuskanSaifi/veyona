import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import jwt from "jsonwebtoken";

export async function GET(req) {
  await connectDB();

  try {
    // Get employee ID from token
    const token = req.cookies.get("employeeToken")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = { employee: employeeId };
    
    // Employee can only see confirmed or completed appointments
    // Pending appointments are only visible to admin until approved
    if (status && status !== "all") {
      // Only allow viewing confirmed or completed status
      if (status === "confirmed" || status === "completed") {
        query.status = status;
      } else {
        // If invalid status is requested, return empty array by filtering out everything
        query.status = { $in: [] };
      }
    } else {
      // By default, only show confirmed and completed appointments
      query.status = { $in: ["confirmed", "completed"] };
    }

    const appointments = await Appointment.find(query)
      .populate("customer")
      .populate("salon")
      .populate("employee")
      .populate("service")
      .populate({
        path: "services.service",
        select: "name image duration price isVideoConsultation category clinic clinicAddress",
        populate: [{ path: "clinic", select: "name address city state pincode" }],
      })
      .sort({ date: 1, time: 1 });

    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unauthorized" },
      { status: 401 }
    );
  }
}




