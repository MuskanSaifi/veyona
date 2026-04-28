import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import Salon from "@/models/Salon";
import Employee from "@/models/Employee";
import Service from "@/models/Service";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const serviceIdsParam = searchParams.get("serviceIds"); // comma-separated for multi-service
  const quantityParam = searchParams.get("quantity");
  const serviceQuantitiesParam = searchParams.get("serviceQuantities"); // comma-separated: <serviceId>:<qty>

  if (!employeeId || !date) {
    return NextResponse.json(
      { message: "Employee ID and date are required" },
      { status: 400 }
    );
  }

  try {
    const quantityRaw = Number(quantityParam);
    const quantity = Number.isFinite(quantityRaw) ? Math.floor(quantityRaw) : 1;
    const safeQuantity = Math.max(1, Math.min(20, quantity));

    const quantitiesById = {};
    if (serviceQuantitiesParam && typeof serviceQuantitiesParam === "string") {
      for (const part of serviceQuantitiesParam.split(",").map((x) => x.trim()).filter(Boolean)) {
        const [id, qtyStr] = part.split(":");
        if (!id) continue;
        const qRaw = Number(qtyStr);
        const q = Number.isFinite(qRaw) ? Math.floor(qRaw) : 1;
        quantitiesById[id.toString()] = Math.max(1, Math.min(20, q));
      }
    }

    // Get employee to find salon
    const employee = await Employee.findById(employeeId).populate("salon");
    
    if (!employee || !employee.salon) {
      return NextResponse.json({ message: "Employee or salon not found" }, { status: 404 });
    }

    const salon = typeof employee.salon === 'object' ? employee.salon : await Salon.findById(employee.salon);
    if (!salon) {
      return NextResponse.json({ message: "Salon not found" }, { status: 404 });
    }
    
    // Enforce business hours 9 AM - 8 PM only (no 24hr slots)
    const openingTime = "09:00";
    const closingTime = "20:00";

    // Get service(s) to know total required duration for this booking
    // but keep slot grid on a fixed 30-min interval so times don't look "clubbed"
    const baseInterval = 30; // minutes between slot start times
    let requiredDuration = baseInterval; // total duration needed for this booking
    if (serviceIdsParam || serviceId) {
      const ids = (serviceIdsParam
        ? serviceIdsParam.split(",").filter(Boolean)
        : [serviceId]
      ).map((id) => id.toString());

      const services = await Service.find({ _id: { $in: ids } }).select("duration").lean();
      if (services.length > 0) {
        if (Object.keys(quantitiesById).length > 0) {
          requiredDuration = services.reduce((sum, s) => {
            const q = quantitiesById[s._id?.toString?.()] || safeQuantity;
            return sum + (s.duration || baseInterval) * q;
          }, 0);
        } else {
          requiredDuration = services.reduce(
            (sum, s) => sum + (s.duration || baseInterval),
            0
          );
          requiredDuration = requiredDuration * safeQuantity;
        }
      }
    }
    if (!serviceIdsParam && serviceId) {
      // single-service path already covered; keep behavior consistent
      requiredDuration = requiredDuration;
    }

    // Get existing appointments for this employee on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      employee: employeeId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      $or: [
        { status: "confirmed" },
        { status: "pending" },
      ],
    })
      .populate("service")
      .select("time service services totalDuration");

    // Generate time slots
    const slots = [];
    const [openHour, openMin] = openingTime.split(":").map(Number);
    const [closeHour, closeMin] = closingTime.split(":").map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Slot times are interpreted in IST (+05:30); compare to current instant via UTC ms.
    const nowMs = Date.now();

    // Generate slots on a fixed grid (e.g. every 30 min),
    // but only keep those where the *full* requiredDuration fits.
    for (let minutes = openMinutes; minutes + requiredDuration <= closeMinutes; minutes += baseInterval) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const slotEndMinutes = minutes + requiredDuration;

      // Compute this slot's start time in IST for the given date
      const slotIstMs = Date.parse(`${date}T${timeString}:00+05:30`);

      // Omit past slots entirely (do not list as booked/disabled)
      if (slotIstMs < nowMs) continue;

      // Check if this slot overlaps with any existing appointment
      const isBooked = existingAppointments.some((apt) => {
        if (!apt.time) return false;
        
        // Parse appointment time
        const [aptHour, aptMin] = apt.time.split(":").map(Number);
        const aptStartMinutes = aptHour * 60 + aptMin;
        
        // Get appointment duration:
        // - Prefer totalDuration (multi-service)
        // - Else sum of services[].duration
        // - Else fallback to single service duration or 30 minutes
        let aptDuration = apt.totalDuration;
        if (!aptDuration && Array.isArray(apt.services) && apt.services.length > 0) {
          aptDuration = apt.services.reduce(
            (sum, s) => sum + (s.duration || 30),
            0
          );
        }
        if (!aptDuration) {
          aptDuration = apt.service?.duration || 30;
        }
        const aptEndMinutes = aptStartMinutes + aptDuration;

        // Check if slots overlap
        // Slot overlaps if: slot starts before appointment ends AND slot ends after appointment starts
        return minutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
      });

      slots.push({
        time: timeString,
        available: !isBooked,
      });
    }

    return NextResponse.json({ slots, slotDuration: requiredDuration });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

