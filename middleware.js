// salon-app/middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Admin routes
  if (pathname.startsWith("/admin")) {
    // login page ko allow karo
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const token = req.cookies.get("adminToken")?.value;

    // token nahi hai → login
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // token hai → allow
    return NextResponse.next();
  }

  // User routes
  if (pathname.startsWith("/user")) {
    // login and register pages ko allow karo
    if (pathname.startsWith("/user/login") || pathname.startsWith("/user/register")) {
      return NextResponse.next();
    }

    const token = req.cookies.get("userToken")?.value;

    // token nahi hai → login
    if (!token) {
      return NextResponse.redirect(new URL("/user/login", req.url));
    }

    // token hai → allow
    return NextResponse.next();
  }

  // Employee routes
  if (pathname.startsWith("/employee")) {
    // login page ko allow karo
    if (pathname.startsWith("/employee/login")) {
      return NextResponse.next();
    }

    const token = req.cookies.get("employeeToken")?.value;

    // token nahi hai → login
    if (!token) {
      return NextResponse.redirect(new URL("/employee/login", req.url));
    }

    // token hai → allow
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/employee/:path*"],
};
