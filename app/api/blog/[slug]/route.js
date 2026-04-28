import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blog from "@/models/Blog";
import cloudinary from "@/lib/cloudinary";

/* ---------------- GET SINGLE BLOG ---------------- */
export async function GET(req, { params }) {
  await connectDB();

  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: "Blog slug is required" }, { status: 400 });
    }

    // Try to find blog with exact slug match
    let blog = await Blog.findOne({ slug: slug.trim(), active: true });
    
    // If not found, try case-insensitive search as fallback
    if (!blog) {
      blog = await Blog.findOne({ 
        slug: { $regex: new RegExp(`^${slug.trim()}$`, 'i') }, 
        active: true 
      });
    }

    if (!blog) {
      console.log(`Blog not found for slug: ${slug}`);
      // Log available slugs for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        const allBlogs = await Blog.find({ active: true }).select('slug title');
        console.log('Available active blogs:', allBlogs.map(b => ({ slug: b.slug, title: b.title })));
      }
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Increment views (fire-and-forget, don't block response)
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).catch(() => {});

    return NextResponse.json(blog, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("Blog fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

/* ---------------- UPDATE BLOG ---------------- */
export async function PUT(req, { params }) {
  await connectDB();

  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: "Blog slug is required" }, { status: 400 });
    }

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const updateData = {};

    const title = formData.get("title");
    const content = formData.get("content");
    const file = formData.get("image");

    if (title) {
      updateData.title = title;
      updateData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    [
      "excerpt",
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "author",
      "category",
    ].forEach((field) => {
      const v = formData.get(field);
      if (v !== null) updateData[field] = v;
    });

    const tags = formData.get("tags");
    if (tags !== null) updateData.tags = tags.split(",").map(t => t.trim());

    const featured = formData.get("featured");
    if (featured !== null) updateData.featured = featured === "true";

    const active = formData.get("active");
    if (active !== null) updateData.active = active === "true";

    /* ---------- FEATURE IMAGE UPDATE ---------- */
    if (file && file.size > 0) {
      if (blog.public_id) {
        await cloudinary.uploader.destroy(blog.public_id);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "blogs" },
          (err, result) => (err ? reject(err) : resolve(result))
        ).end(buffer);
      });

      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    /* ---------- INLINE IMAGE CLEANUP ---------- */
    if (content) {
      updateData.content = content;

      const newImages = [];
      const regex = /data-public-id="([^"]+)"/g;
      let m;
      while ((m = regex.exec(content)) !== null) {
        newImages.push(m[1]);
      }

      // delete removed images
      const removed = blog.contentImages.filter(
        (id) => !newImages.includes(id)
      );

      await Promise.all(
        removed.map((id) => cloudinary.uploader.destroy(id))
      );

      updateData.contentImages = newImages;
    }

    const updated = await Blog.findByIdAndUpdate(blog._id, updateData, {
      new: true,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Blog update error:", err);
    return NextResponse.json(
      { message: err.message || "Failed to update blog" },
      { status: 500 }
    );
  }
}

/* ---------------- DELETE BLOG ---------------- */
export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const { slug } = await params;
    const blog = await Blog.findOne({ slug });
    
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Delete feature image
    if (blog.public_id) {
      try {
        await cloudinary.uploader.destroy(blog.public_id);
        console.log(`Deleted feature image: ${blog.public_id}`);
      } catch (err) {
        console.error("Error deleting feature image:", err);
      }
    }

    // Collect all content image public_ids
    const contentImageIds = new Set();

    // First, add images from contentImages array
    if (blog.contentImages?.length) {
      blog.contentImages.forEach((id) => contentImageIds.add(id));
    }

    // Also extract images directly from content HTML as fallback
    // This ensures we catch all images even if contentImages array is incomplete
    if (blog.content) {
      const regex = /data-public-id="([^"]+)"/g;
      let match;
      while ((match = regex.exec(blog.content)) !== null) {
        contentImageIds.add(match[1]);
      }
    }

    // Delete all content images from Cloudinary
    if (contentImageIds.size > 0) {
      try {
        const deletePromises = Array.from(contentImageIds).map(async (id) => {
          try {
            await cloudinary.uploader.destroy(id);
            console.log(`Deleted content image: ${id}`);
          } catch (err) {
            console.error(`Error deleting content image ${id}:`, err);
          }
        });
        await Promise.all(deletePromises);
        console.log(`Deleted ${contentImageIds.size} content image(s) from Cloudinary`);
      } catch (err) {
        console.error("Error deleting content images:", err);
      }
    }

    await blog.deleteOne();
    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Blog deletion error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete blog" },
      { status: 500 }
    );
  }
}
