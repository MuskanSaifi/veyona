import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ message: "Logout successful" });
  res.cookies.delete("userToken");
  return res;
}

