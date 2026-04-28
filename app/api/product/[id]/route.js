import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const product = await Product.findById(id)
    .populate("category")
    .populate("parentProduct");
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
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
    const category = formData.get("category");
    const parentProduct = formData.get("parentProduct");
    const order = formData.get("order");
    const active = formData.get("active");

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Determine final parentProduct value
    const finalParentProduct = 
      parentProduct !== null && parentProduct !== "null" && parentProduct !== "" 
        ? parentProduct 
        : (parentProduct === "null" || parentProduct === "" ? null : product.parentProduct);

    // Determine final price and originalPrice values
    const finalPrice = price && price !== "" && price !== "null" ? parseFloat(price) : (price === "" || price === "null" ? undefined : product.price);
    const finalOriginalPrice = originalPrice !== null && originalPrice !== undefined && originalPrice !== "" && originalPrice !== "null" ? parseFloat(originalPrice) : (originalPrice === "" || originalPrice === "null" ? undefined : product.originalPrice);

    // Check if this product has any children
    const childrenCount = await Product.countDocuments({ 
      parentProduct: id 
    });

    // IMPORTANT: If product has children, it CANNOT have price (it's a grouping category)
    if (childrenCount > 0 && finalPrice !== undefined) {
      return NextResponse.json(
        { message: "This product has children, so it cannot have price. Only leaf products (products without children) can be buyable." },
        { status: 400 }
      );
    }

    // If product is being assigned a parent, check if the parent has price and remove it
    if (finalParentProduct && finalParentProduct !== product.parentProduct?.toString()) {
      const parentProductDoc = await Product.findById(finalParentProduct);
      if (parentProductDoc && parentProductDoc.price) {
        // Parent now has a child, so it's a grouping category - remove price
        parentProductDoc.price = undefined;
        await parentProductDoc.save();
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;
    
    // Update price/originalPrice based on children count
    if (childrenCount === 0) {
      if (finalPrice !== undefined) updateData.price = finalPrice;
      if (finalOriginalPrice !== undefined) updateData.originalPrice = finalOriginalPrice;
      if (price === "" || price === "null") updateData.price = undefined;
      if (originalPrice === "" || originalPrice === "null") updateData.originalPrice = undefined;
    } else {
      updateData.price = undefined;
      updateData.originalPrice = undefined;
    }
    
    if (category) updateData.category = category;
    if (finalParentProduct !== undefined) {
      updateData.parentProduct = finalParentProduct;
    }
    if (order) updateData.order = parseInt(order);
    if (order === "" || order === "null") updateData.order = 0;
    if (active !== null) updateData.active = active === "true";

    if (file && file !== "null") {
      if (product.public_id) {
        await cloudinary.uploader.destroy(product.public_id);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "products" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("category")
      .populate("parentProduct");

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

  const product = await Product.findById(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (product.public_id) {
    await cloudinary.uploader.destroy(product.public_id);
  }

  await Product.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}


