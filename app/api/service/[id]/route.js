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
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;
    
    // Update price/originalPrice/duration based on children count
    if (childrenCount === 0) {
      // Leaf node (no children) - can have price/duration to be bookable
      if (finalPrice !== undefined) updateData.price = finalPrice;
      if (finalOriginalPrice !== undefined) updateData.originalPrice = finalOriginalPrice;
      if (finalDuration !== undefined) updateData.duration = finalDuration;
      
      if (price === "" || price === "null") updateData.price = undefined;
      if (originalPrice === "" || originalPrice === "null") updateData.originalPrice = undefined;
      if (duration === "" || duration === "null") updateData.duration = undefined;
    } else {
      // Has children - grouping service, must remove price/duration
      updateData.price = undefined;
      updateData.originalPrice = undefined;
      updateData.duration = undefined;
    }
    
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
    if (order) updateData.order = parseInt(order);
    if (order === "" || order === "null") updateData.order = 0;
    if (active !== null) updateData.active = active === "true";
    if (isVideoConsultation !== null && isVideoConsultation !== undefined) {
      updateData.isVideoConsultation = isVideoConsultation === "true";
    }

    if (file && file !== "null") {
      if (service.public_id) {
        await cloudinary.uploader.destroy(service.public_id);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "services" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Service.findByIdAndUpdate(id, updateData, {
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




