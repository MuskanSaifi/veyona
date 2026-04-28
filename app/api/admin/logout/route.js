import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set("adminToken", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
