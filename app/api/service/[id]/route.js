import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import Salon from "@/models/Salon";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const service = await Service.findById(id)
    .populate("category")
    .populate("parentService")
    .populate("clinic", "name address city state pincode");
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(service);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const price = formData.get("price");
    const originalPrice = formData.get("originalPrice");
    const duration = formData.get("duration");
    const category = formData.get("category");
    const parentService = formData.get("parentService");
    const clinic = formData.get("clinic");
    const order = formData.get("order");
    const active = formData.get("active");
    const isVideoConsultation = formData.get("isVideoConsultation");

    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Determine final parentService value
    const finalParentService = 
      parentService !== null && parentService !== "null" && parentService !== "" 
        ? parentService 
        : (parentService === "null" || parentService === "" ? null : service.parentService);

    // Determine final price/originalPrice/duration values
    const finalPrice = price && price !== "" && price !== "null" ? parseFloat(price) : (price === "" || price === "null" ? undefined : service.price);
    const finalOriginalPrice = originalPrice !== null && originalPrice !== undefined && originalPrice !== "" && originalPrice !== "null" ? parseFloat(originalPrice) : (originalPrice === "" || originalPrice === "null" ? undefined : service.originalPrice);
    const finalDuration = duration && duration !== "" && duration !== "null" ? parseInt(duration) : (duration === "" || duration === "null" ? undefined : service.duration);

    // Check if this service has any children (if so, it's a grouping service - not bookable)
    const childrenCount = await Service.countDocuments({ 
      parentService: id 
    });

    // IMPORTANT: If service has children, it CANNOT have price/duration (it's a grouping service)
    if (childrenCount > 0 && (finalPrice !== undefined || finalDuration !== undefined)) {
      return NextResponse.json(
        { message: "This service has children, so it cannot have price and duration. Only leaf services (services without children) can be bookable." },
        { status: 400 }
      );
    }

    // If service is being assigned a parent, check if the parent has price/duration and remove it
    if (finalParentService && finalParentService !== service.parentService?.toString()) {
      const parentServiceDoc = await Service.findById(finalParentService);
      if (parentServiceDoc && (parentServiceDoc.price || parentServiceDoc.duration)) {
        // Parent now has a child, so it's a grouping service - remove price/duration
        parentServiceDoc.price = undefined;
        parentServiceDoc.duration = undefined;
        await parentServiceDoc.save();
      }
    }

    const updateData = {};
    const unsetData = {};
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;

    const setNumeric = (field, raw, finalVal) => {
      if (childrenCount > 0) {
        unsetData[field] = "";
        return;
      }
      if (raw === "" || raw === "null") {
        unsetData[field] = "";
        return;
      }
      if (finalVal === undefined || finalVal === null || Number.isNaN(finalVal)) {
        return;
      }
      updateData[field] = finalVal;
    };

    setNumeric("price", price, finalPrice);
    setNumeric("originalPrice", originalPrice, finalOriginalPrice);
    setNumeric("duration", duration, finalDuration);
    
    if (category) updateData.category = category;
    if (finalParentService !== undefined) {
      updateData.parentService = finalParentService;
    }
    if (clinic !== null && clinic !== undefined) {
      if (clinic === "" || clinic === "null") {
        updateData.clinic = null;
        updateData.clinicAddress = "";
      } else {
        const clinicDoc = await Salon.findById(clinic).select("address city state pincode").lean();
        if (clinicDoc) {
          updateData.clinic = clinic;
          updateData.clinicAddress = [clinicDoc.address, clinicDoc.city, clinicDoc.state, clinicDoc.pincode]
            .filter(Boolean)
            .join(", ");
        }
      }
    }
    if (order !== null && order !== undefined) {
      if (order === "" || order === "null") {
        updateData.order = 0;
      } else {
        const parsedOrder = parseInt(order, 10);
        if (!Number.isNaN(parsedOrder)) updateData.order = parsedOrder;
      }
    }
    if (active !== null) updateData.active = active === "true";
    if (isVideoConsultation !== null && isVideoConsultation !== undefined) {
      updateData.isVideoConsultation = isVideoConsultation === "true";
    }

    const hasNewImage =
      file &&
      file !== "null" &&
      typeof file === "object" &&
      typeof file.arrayBuffer === "function" &&
      (file.size == null || file.size > 0);

    if (hasNewImage) {
      if (service.public_id) {
        try {
          await cloudinary.uploader.destroy(service.public_id);
        } catch {
          /* ignore destroy errors */
        }
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "services" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });
      if (!upload?.secure_url) {
        return NextResponse.json(
          { message: "Image upload failed. Please try again." },
          { status: 500 }
        );
      }
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const mongoUpdate =
      Object.keys(unsetData).length > 0
        ? { $set: updateData, $unset: unsetData }
        : updateData;

    const updated = await Service.findByIdAndUpdate(id, mongoUpdate, {
      new: true,
    })
      .populate("category")
      .populate("parentService")
      .populate("clinic", "name address city state pincode");

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;

  const service = await Service.findById(id);
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (service.public_id) {
    await cloudinary.uploader.destroy(service.public_id);
  }

  await Service.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




