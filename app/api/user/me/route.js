import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

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

    const user = await User.findById(decoded.id).select("-otp -otpExpiry");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const savedAddresses = user.savedAddresses?.length
      ? user.savedAddresses
      : user.address
        ? [{ label: "Home", address: user.address }]
        : [];
    const defaultAddressIndex = Math.min(
      user.defaultAddressIndex ?? 0,
      Math.max(0, savedAddresses.length - 1)
    );

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        address: user.address,
        savedAddresses,
        defaultAddressIndex,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export async function PATCH(req) {
  await connectDB();

  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    if (typeof body.name === "string") {
      const name = body.name.trim();
      user.name = name ? name.slice(0, 80) : user.name;
    }
    if (typeof body.email === "string") {
      const email = body.email.trim();
      user.email = email ? email.slice(0, 120) : "";
    }
    if (Array.isArray(body.savedAddresses)) {
      const list = body.savedAddresses
        .filter((a) => a && typeof a.address === "string" && a.address.trim())
        .map((a, idx) => ({
          label: (a.label || "").trim() || `Address ${idx + 1}`,
          address: a.address.trim(),
        }));
      user.savedAddresses = list;
    }
    if (typeof body.defaultAddressIndex === "number" && body.defaultAddressIndex >= 0) {
      user.defaultAddressIndex = Math.min(
        body.defaultAddressIndex,
        Math.max(0, (user.savedAddresses?.length ?? 1) - 1)
      );
    }

    // Also keep root address in sync with selected default so legacy code still sees it
    if (Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0) {
      const idx = user.defaultAddressIndex ?? 0;
      const effectiveIdx = Math.min(idx, user.savedAddresses.length - 1);
      user.address = user.savedAddresses[effectiveIdx]?.address || user.address;
    }
    await user.save();

    const savedAddresses = user.savedAddresses?.length ? user.savedAddresses : user.address ? [{ label: "Home", address: user.address }] : [];
    const defaultAddressIndex = Math.min(user.defaultAddressIndex ?? 0, Math.max(0, savedAddresses.length - 1));

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        address: user.address,
        savedAddresses,
        defaultAddressIndex,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Invalid or expired token" },
      { status: 401 }
    );
  }
}

