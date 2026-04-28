import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const parentProductId = searchParams.get("parentProductId");
  const includeChildren = searchParams.get("includeChildren") === "true";

  const query = {};
  if (categoryId) query.category = categoryId;
  if (parentProductId) {
    query.parentProduct = parentProductId;
  } else if (includeChildren === false) {
    query.parentProduct = { $exists: false };
  }

  // Optimize query - only fetch active products and select needed fields
  const baseQuery = { ...query, active: true };
  
  const products = await Product.find(baseQuery)
    .populate("category", "name type")
    .select("name description price originalPrice image category parentProduct active order")
    .sort({ order: 1, createdAt: -1 })
    .lean(); // Use lean() for better performance

  // Manually populate parentProduct
  const productsWithParent = await Promise.all(
    products.map(async (product) => {
      if (product.parentProduct) {
        try {
          const parent = await Product.findById(product.parentProduct)
            .select("name description image price originalPrice")
            .lean();
          product.parentProduct = parent;
        } catch (err) {
          console.error("Error populating parentProduct:", err);
          product.parentProduct = null;
        }
      }
      return product;
    })
  );

  // Cache for 60 seconds (ISR)
  return NextResponse.json(productsWithParent, {
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
    const category = formData.get("category");
    const parentProduct = formData.get("parentProduct");
    const order = formData.get("order");

    if (!name || !category) {
      return NextResponse.json(
        { message: "Name and category are required" },
        { status: 400 }
      );
    }
    
    // Price is optional - grouping products don't have price
    // Only leaf products (products without children) need price

    let image = "";
    let public_id = "";

    if (file) {
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
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const productData = {
      name,
      description,
      category,
      image,
      public_id,
    };
    
    // Add price/originalPrice only if provided (for buyable leaf products)
    if (price && price !== "" && price !== "null") {
      productData.price = parseFloat(price);
    }
    if (originalPrice && originalPrice !== "" && originalPrice !== "null") {
      productData.originalPrice = parseFloat(originalPrice);
    }
    
    if (parentProduct && parentProduct !== "null") {
      productData.parentProduct = parentProduct;
    }
    
    if (order) productData.order = parseInt(order);

    const product = await Product.create(productData);

    // IMPORTANT: If this product has a parent, the parent becomes a grouping category
    // Check parent product and remove price if it has any (now it has a child)
    if (product.parentProduct) {
      const parentId = typeof product.parentProduct === "object" 
        ? product.parentProduct._id || product.parentProduct 
        : product.parentProduct;
      
      const parentProductDoc = await Product.findById(parentId);
      if (parentProductDoc && parentProductDoc.price) {
        // Parent now has a child, so it's a grouping category - remove price
        parentProductDoc.price = undefined;
        await parentProductDoc.save();
      }
    }

    const populated = await Product.findById(product._id)
      .populate("category")
      .populate("parentProduct");

    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

