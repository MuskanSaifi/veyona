import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Reel from "@/models/Reel";
import cloudinary from "@/lib/cloudinary";

await connectDB();

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const reel = await Reel.findById(id);
    if (!reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    if (reel.public_id) {
      await cloudinary.uploader.destroy(reel.public_id, { resource_type: "video" });
    }

    // Delete from DB
    await Reel.findByIdAndDelete(id);

    return NextResponse.json({ message: "Reel deleted successfully" });
  } catch (error) {
    console.error("Error deleting reel:", error);
    return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 });
  }
}