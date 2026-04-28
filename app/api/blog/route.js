import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/models/Blog";
import cloudinary from "@/lib/cloudinary";

/* ---------------- GET BLOGS ---------------- */
export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const limit = searchParams.get("limit");

  const query = { active: true };
  if (featured === "true") query.featured = true;

  let q = Blog.find(query).sort({ createdAt: -1 }).select("title slug excerpt image author category tags featured createdAt");
  if (limit) q = q.limit(Number(limit));

  const blogs = await q.lean();
  return NextResponse.json(blogs, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

/* ---------------- CREATE BLOG ---------------- */
export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();

    const title = formData.get("title");
    const excerpt = formData.get("excerpt");
    const content = formData.get("content");
    const author = formData.get("author");
    const category = formData.get("category");
    const tags = formData.get("tags");
    const featured = formData.get("featured");
    const metaTitle = formData.get("metaTitle");
    const metaDescription = formData.get("metaDescription");
    const metaKeywords = formData.get("metaKeywords");
    const file = formData.get("image");

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { message: "Title, excerpt & content required" },
        { status: 400 }
      );
    }

    /* ---------- SLUG ---------- */
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const exists = await Blog.findOne({ slug });
    if (exists) {
      return NextResponse.json(
        { message: "Blog with this title already exists" },
        { status: 400 }
      );
    }

    /* ---------- FEATURE IMAGE ---------- */
    let image = "";
    let public_id = "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "blogs" },
          (err, result) => (err ? reject(err) : resolve(result))
        ).end(buffer);
      });

      image = upload.secure_url;
      public_id = upload.public_id;
    }

    /* ---------- EXTRACT INLINE IMAGE IDS ---------- */
    const contentImages = [];
    const regex = /data-public-id="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      contentImages.push(match[1]);
    }

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      image,
      public_id,
      contentImages,
      author: author || "Admin",
      category: category || "",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      featured: featured === "true",
    });

    return NextResponse.json(blog);
  } catch (err) {
    console.error("Blog creation error:", err);
    return NextResponse.json(
      { message: err.message || "Failed to create blog" },
      { status: 500 }
    );
  }
}
