import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageContent from "@/models/PageContent";

export async function GET(req, { params }) {
  await connectDB();

  try {
    const { pageType } = await params;
    const pageContent = await PageContent.findOne({ pageType, active: true });

    if (!pageContent) {
      return NextResponse.json(
        { message: "Page content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(pageContent);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const { pageType } = await params;
    const body = await req.json();
    const { title, heroTitle, heroDescription, content, metaTitle, metaDescription, metaKeywords, active } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    const pageContent = await PageContent.findOneAndUpdate(
      { pageType },
      {
        title,
        heroTitle: heroTitle || title,
        heroDescription,
        content,
        metaTitle,
        metaDescription,
        metaKeywords,
        lastUpdated: new Date(),
        active: active !== undefined ? active : true,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(pageContent);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
