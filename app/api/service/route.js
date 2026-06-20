import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import Salon from "@/models/Salon";
import cloudinary from "@/lib/cloudinary";
import { uploadImageBuffer } from "@/lib/cloudinaryUpload";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const categoryIds = searchParams.get("categoryIds"); // comma-separated for multiple
  const parentServiceId = searchParams.get("parentServiceId");
  const includeChildren = searchParams.get("includeChildren") === "true";

  const query = {};
  if (categoryIds) {
    const ids = categoryIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length) {
      query.category = { $in: ids };
    }
  } else if (categoryId) query.category = categoryId;
  if (parentServiceId) {
    query.parentService = parentServiceId;
  } else if (includeChildren === false) {
    query.parentService = { $exists: false };
  }

  // Optimize query - only fetch active services and select needed fields
  const baseQuery = { ...query, active: true };
  
  const services = await Service.find(baseQuery)
    .populate("category", "name type")
    .populate("clinic", "name address city state pincode")
    .select("name description price originalPrice duration image category parentService clinic clinicAddress active order isVideoConsultation")
    .sort({ order: 1, createdAt: -1 })
    .lean(); // Use lean() for better performance

  // Manually populate parentService to avoid schema caching issues
  const servicesWithParent = await Promise.all(
    services.map(async (service) => {
      if (service.parentService) {
        try {
          const parent = await Service.findById(service.parentService)
            .select("name description image price originalPrice duration")
            .lean();
          service.parentService = parent;
        } catch (err) {
          console.error("Error populating parentService:", err);
          service.parentService = null;
        }
      }
      return service;
    })
  );

  // Cache for 60 seconds (ISR)
  return NextResponse.json(servicesWithParent, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}

export async function POST(req) {
  await connectDB();

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
    const isVideoConsultation = formData.get("isVideoConsultation") === "true";

    if (!name || !category) {
      return NextResponse.json(
        { message: "Name and category are required" },
        { status: 400 }
      );
    }

    // No strict validation at creation time
    // Service can be created with or without price/duration
    // Backend will handle removing price/duration if children are added later
    // Leaf nodes (no children) will be bookable if they have price/duration

    let image = "";
    let public_id = "";

    const hasNewImage =
      file &&
      file !== "null" &&
      typeof file === "object" &&
      typeof file.arrayBuffer === "function" &&
      (file.size == null || file.size > 0);

    if (hasNewImage) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await uploadImageBuffer(buffer, "services");
        image = upload.secure_url;
        public_id = upload.public_id;
      } catch (uploadErr) {
        return NextResponse.json(
          { message: uploadErr.message || "Image upload failed. Check Cloudinary settings on the server." },
          { status: 500 }
        );
      }
    }

    const serviceData = {
      name,
      description,
      category,
      image,
      public_id,
    };

    // Add price/originalPrice/duration if provided
    if (price && price !== "" && price !== "null") {
      serviceData.price = parseFloat(price);
    }
    if (originalPrice && originalPrice !== "" && originalPrice !== "null") {
      serviceData.originalPrice = parseFloat(originalPrice);
    }
    if (duration && duration !== "" && duration !== "null") {
      serviceData.duration = parseInt(duration);
    }
    
    if (parentService && parentService !== "null") {
      serviceData.parentService = parentService;
    }
    if (clinic && clinic !== "null" && clinic !== "") {
      const clinicDoc = await Salon.findById(clinic).select("name address city state pincode type").lean();
      if (clinicDoc) {
        serviceData.clinic = clinicDoc._id;
        serviceData.clinicAddress = [clinicDoc.address, clinicDoc.city, clinicDoc.state, clinicDoc.pincode]
          .filter(Boolean)
          .join(", ");
      }
    }
    
    if (order) serviceData.order = parseInt(order);
    serviceData.isVideoConsultation = isVideoConsultation;

    const service = await Service.create(serviceData);

    // IMPORTANT: If this service has a parent, the parent becomes a grouping service
    // Check parent service and remove price/duration if it has any (now it has a child)
    if (service.parentService) {
      const parentId = typeof service.parentService === "object" 
        ? service.parentService._id || service.parentService 
        : service.parentService;
      
      const parentService = await Service.findById(parentId);
      if (parentService && (parentService.price || parentService.duration)) {
        // Parent now has a child, so it's a grouping service - remove price/duration
        parentService.price = undefined;
        parentService.duration = undefined;
        await parentService.save();
      }
    }

    // Note: At creation time, the new service won't have children yet
    // If children are added later, the PUT endpoint will handle removing price/duration from parent
    // We don't need to check for children here since service was just created

    const populated = await Service.findById(service._id)
      .populate("category")
      .populate("parentService")
      .populate("clinic", "name address city state pincode");

    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}





