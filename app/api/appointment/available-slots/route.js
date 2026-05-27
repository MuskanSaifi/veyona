import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import Employee from "@/models/Employee";
import Service from "@/models/Service";

const OPENING_TIME = "09:00";
const CLOSING_TIME = "20:00";
const BASE_INTERVAL = 30;

function getIstDayBounds(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+05:30`);
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { start, end };
}

function getAppointmentDurationMinutes(apt) {
  let aptDuration = apt.totalDuration;
  if (!aptDuration && Array.isArray(apt.services) && apt.services.length > 0) {
    aptDuration = apt.services.reduce((sum, s) => sum + (s.duration || 30), 0);
  }
  if (!aptDuration) {
    aptDuration = apt.service?.duration || 30;
  }
  return aptDuration;
}

async function resolveRequiredDuration({
  serviceId,
  serviceIdsParam,
  quantitiesById,
  safeQuantity,
}) {
  const baseInterval = BASE_INTERVAL;
  let requiredDuration = baseInterval;

  if (!serviceIdsParam && !serviceId) {
    return requiredDuration;
  }

  const ids = (serviceIdsParam
    ? serviceIdsParam.split(",").filter(Boolean)
    : [serviceId]
  ).map((id) => id.toString());

  const services = await Service.find({ _id: { $in: ids } }).select("duration").lean();
  if (services.length === 0) {
    return requiredDuration;
  }

  if (Object.keys(quantitiesById).length > 0) {
    requiredDuration = services.reduce((sum, s) => {
      const q = quantitiesById[s._id?.toString?.()] || safeQuantity;
      const mins = s.duration > 0 ? s.duration : baseInterval;
      return sum + mins * q;
    }, 0);
  } else {
    requiredDuration = services.reduce((sum, s) => {
      const mins = s.duration > 0 ? s.duration : baseInterval;
      return sum + mins;
    }, 0);
    requiredDuration = requiredDuration * safeQuantity;
  }

  return Math.max(baseInterval, requiredDuration);
}

function generateSlotsForEmployee({
  date,
  employeeId,
  existingAppointments,
  requiredDuration,
  openMinutes,
  closeMinutes,
  nowMs,
}) {
  const slots = [];

  for (let minutes = openMinutes; minutes + requiredDuration <= closeMinutes; minutes += BASE_INTERVAL) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
    const slotEndMinutes = minutes + requiredDuration;
    const slotIstMs = Date.parse(`${date}T${timeString}:00+05:30`);

    if (slotIstMs < nowMs) continue;

    const isBooked = existingAppointments.some((apt) => {
      if (!apt.time) return false;
      const [aptHour, aptMin] = apt.time.split(":").map(Number);
      const aptStartMinutes = aptHour * 60 + aptMin;
      const aptEndMinutes = aptStartMinutes + getAppointmentDurationMinutes(apt);
      return minutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
    });

    slots.push({
      time: timeString,
      available: !isBooked,
      employeeId: String(employeeId),
    });
  }

  return slots;
}

function mergeSlotsAcrossEmployees(perEmployeeSlots) {
  const byTime = new Map();

  for (const list of perEmployeeSlots) {
    for (const slot of list) {
      const existing = byTime.get(slot.time);
      if (!existing) {
        byTime.set(slot.time, {
          time: slot.time,
          available: slot.available,
          employeeIds: slot.available ? [slot.employeeId] : [],
        });
        continue;
      }
      if (slot.available) {
        existing.available = true;
        if (!existing.employeeIds.includes(slot.employeeId)) {
          existing.employeeIds.push(slot.employeeId);
        }
      }
    }
  }

  return Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));
}

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const employeeIdsParam = searchParams.get("employeeIds");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const serviceIdsParam = searchParams.get("serviceIds");
  const quantityParam = searchParams.get("quantity");
  const serviceQuantitiesParam = searchParams.get("serviceQuantities");

  const employeeIds = employeeIdsParam
    ? employeeIdsParam.split(",").map((x) => x.trim()).filter(Boolean)
    : employeeId
    ? [employeeId]
    : [];

  if (!employeeIds.length || !date) {
    return NextResponse.json(
      { message: "Employee ID(s) and date are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
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

    const employees = await Employee.find({ _id: { $in: employeeIds } }).select("_id salon active");
    const activeIds = employees.filter((e) => e.active !== false).map((e) => String(e._id));

    if (activeIds.length === 0) {
      return NextResponse.json({ message: "No active employees found" }, { status: 404 });
    }

    const requiredDuration = await resolveRequiredDuration({
      serviceId,
      serviceIdsParam,
      quantitiesById,
      safeQuantity,
    });

    const [openHour, openMin] = OPENING_TIME.split(":").map(Number);
    const [closeHour, closeMin] = CLOSING_TIME.split(":").map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const businessWindow = closeMinutes - openMinutes;

    if (requiredDuration > businessWindow) {
      return NextResponse.json({
        slots: [],
        slotDuration: requiredDuration,
        reason: "duration_exceeds_hours",
        message:
          "This booking needs more time than our daily service window (9 AM – 8 PM). Please reduce quantity or contact us.",
      });
    }

    const { start: startOfDay, end: endOfDay } = getIstDayBounds(date);
    const nowMs = Date.now();

    const perEmployeeSlots = [];

    for (const eid of activeIds) {
      const existingAppointments = await Appointment.find({
        employee: eid,
        date: { $gte: startOfDay, $lte: endOfDay },
        $or: [{ status: "confirmed" }, { status: "pending" }],
      })
        .populate("service")
        .select("time service services totalDuration");

      perEmployeeSlots.push(
        generateSlotsForEmployee({
          date,
          employeeId: eid,
          existingAppointments,
          requiredDuration,
          openMinutes,
          closeMinutes,
          nowMs,
        })
      );
    }

    const slots = mergeSlotsAcrossEmployees(perEmployeeSlots);

    let reason = null;
    if (slots.length === 0) {
      const lastPossibleStart = closeMinutes - requiredDuration;
      const lastSlotIstMs = Date.parse(
        `${date}T${String(Math.floor(lastPossibleStart / 60)).padStart(2, "0")}:${String(lastPossibleStart % 60).padStart(2, "0")}:00+05:30`
      );
      if (lastSlotIstMs < nowMs) {
        reason = "all_past";
      } else {
        reason = "none_fit";
      }
    } else if (slots.every((s) => !s.available)) {
      reason = "all_booked";
    }

    return NextResponse.json({ slots, slotDuration: requiredDuration, reason });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
