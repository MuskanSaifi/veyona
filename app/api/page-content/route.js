import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PageContent from "@/models/PageContent";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const pageType = searchParams.get("pageType");

  try {
    let query = {};
    if (pageType) {
      query.pageType = pageType;
    }

    const pages = await PageContent.find(query).sort({ createdAt: -1 });
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { pageType, title, heroTitle, heroDescription, content, metaTitle, metaDescription, metaKeywords } = body;

    if (!pageType || !title || !content) {
      return NextResponse.json(
        { message: "PageType, title, and content are required" },
        { status: 400 }
      );
    }

    const pageContent = await PageContent.create({
      pageType,
      title,
      heroTitle: heroTitle || title,
      heroDescription,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      lastUpdated: new Date(),
    });

    return NextResponse.json(pageContent, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Page content for this pageType already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
