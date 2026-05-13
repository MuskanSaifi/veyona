import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { getCustomerIdsForUser } from "@/lib/customerLookup";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapText(text, font, size, maxWidth) {
  const raw = String(text ?? "");
  const paragraphs = raw.split(/\r?\n/);
  const lines = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      const width = font.widthOfTextAtSize(next, size);
      if (width <= maxWidth) {
        current = next;
        continue;
      }

      if (current) lines.push(current);
      // If a single word is too long, hard-split it.
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = "";
        for (const ch of w) {
          const test = chunk + ch;
          if (font.widthOfTextAtSize(test, size) <= maxWidth) {
            chunk = test;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = w;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

export async function GET(req, { params }) {
  await connectDB();
  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const customerIds = await getCustomerIdsForUser(user);
    if (!customerIds.length) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const { id } = await params;
    const apt = await Appointment.findById(id)
      .populate("customer")
      .populate("salon")
      .populate("service")
      .lean();

    if (!apt) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }
    const aptCustomerId = String(apt.customer?._id || apt.customer || "");
    if (!customerIds.some((cid) => String(cid) === aptCustomerId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const subtotal = Number(apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0);
    const discount = Number(apt.pricing?.discountAmount ?? 0);
    const total = Math.max(0, Number(apt.pricing?.totalPayable ?? subtotal - discount));
    const paidOnline = Number(apt.payment?.paidOnline ?? 0);
    const paidCash = Number(apt.payment?.paidCash ?? 0);
    const paid = paidOnline + paidCash;
    const remaining = Math.max(0, total - paid);

    const services = Array.isArray(apt.services) && apt.services.length > 0
      ? apt.services
      : [{ name: apt.service?.name || "Service", duration: apt.service?.duration || 0, price: apt.service?.price || total }];

    const invoiceNo = `VEY-${String(apt._id).slice(-8).toUpperCase()}`;
    const successfulPayments = Array.isArray(apt.payments)
      ? apt.payments
          .filter((p) => p && (p.status === "captured" || p.status === "recorded") && p.createdAt)
          .map((p) => new Date(p.createdAt))
          .filter((d) => !Number.isNaN(d.getTime()))
      : [];
    const invoiceBaseDate =
      successfulPayments.length > 0
        ? successfulPayments.sort((a, b) => a.getTime() - b.getTime())[0]
        : (apt.updatedAt ? new Date(apt.updatedAt) : (apt.createdAt ? new Date(apt.createdAt) : new Date()));
    const invoiceDate = invoiceBaseDate.toLocaleDateString("en-IN");
    const bookingDate = new Date(apt.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const pageWidth = page.getWidth();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const blue = rgb(11 / 255, 78 / 255, 162 / 255);
    const lightBlue = rgb(214 / 255, 233 / 255, 255 / 255);
    const midBlue = rgb(159 / 255, 198 / 255, 245 / 255);
    const darkText = rgb(16 / 255, 42 / 255, 67 / 255);

    const drawText = (text, x, y, size = 10, bold = false, color = darkText) => {
      page.drawText(String(text ?? ""), {
        x,
        y,
        size,
        font: bold ? fontBold : fontRegular,
        color,
      });
    };

    // Logo (from public/images/invoice_logo.png)
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "invoice_logo.png");
      const logoBytes = await fs.readFile(logoPath);
      const logoImg = await pdfDoc.embedPng(logoBytes);
      const logoSize = 88;
      page.drawImage(logoImg, {
        x: 42,
        y: 745,
        width: logoSize,
        height: logoSize,
      });
    } catch {
      // Fallback: Brand circle if logo not readable
      page.drawCircle({ x: 72, y: 770, size: 44, color: blue });
      drawText("VEYONA", 48, 770, 11, true, rgb(1, 1, 1));
      drawText("SERVICES", 48, 756, 8, false, rgb(1, 1, 1));
    }

    // Company name under logo
    drawText("Veyona Services Pvt Ltd.", 42, 732, 12, true, darkText);

    // Header
    drawText("INVOICE", pageWidth - 200, 796, 36, true, blue);
    drawText("Invoice No:", pageWidth - 220, 748, 11, true);
    drawText(invoiceNo, pageWidth - 150, 748, 10);
    drawText("Date:", pageWidth - 220, 732, 11, true);
    drawText(invoiceDate, pageWidth - 150, 732, 10);

    // Issued to
    let y = 665;
    drawText("ISSUED TO:", 42, y, 10, true, rgb(51 / 255, 78 / 255, 104 / 255));
    y -= 16;
    drawText(esc(apt.customer?.name || user.name || "Customer"), 42, y, 12, true);
    y -= 14;
    drawText(esc(apt.customer?.phone || user.phone || ""), 42, y, 10);
    y -= 13;
    drawText(esc(apt.customer?.email || user.email || ""), 42, y, 10);
    y -= 18;
    drawText(`Booking: ${bookingDate} at ${esc(apt.time || "-")} (${esc(apt.salon?.name || "-")})`, 42, y, 10);

    // Table
    let tableTop = 590;
    page.drawRectangle({ x: 42, y: tableTop, width: pageWidth - 84, height: 22, color: blue });
    drawText("DESCRIPTION", 52, tableTop + 7, 10, true, rgb(1, 1, 1));
    drawText("UNIT PRICE", 300, tableTop + 7, 10, true, rgb(1, 1, 1));
    drawText("QTY", 415, tableTop + 7, 10, true, rgb(1, 1, 1));
    drawText("TOTAL", 475, tableTop + 7, 10, true, rgb(1, 1, 1));

    const col = {
      descX: 52,
      unitX: 300,
      qtyX: 425,
      totalX: 470,
      descWidth: 235, // fits between descX and unitX with padding
    };
    const rowFontSize = 10;
    const lineHeight = 12;

    let rowY = tableTop - 20;
    services.forEach((s, idx) => {
      const lineTotal = Number(s.price || 0);
      const desc = `${idx + 1}. ${esc(s.name || "Service")}`;
      const descLines = wrapText(desc, fontRegular, rowFontSize, col.descWidth);
      const contentHeight = Math.max(1, descLines.length) * lineHeight;
      // Keep a larger safe gap below the last line so descenders never touch the separator.
      const rowHeight = Math.max(40, contentHeight + 28);

      // Draw multi-line description
      descLines.forEach((ln, i) => {
        drawText(ln, col.descX, rowY - i * lineHeight, rowFontSize, false, rgb(36 / 255, 59 / 255, 83 / 255));
      });

      // Draw other columns aligned to first line
      drawText(`Rs ${lineTotal.toFixed(2)}`, col.unitX, rowY, rowFontSize);
      drawText("1", col.qtyX, rowY, rowFontSize);
      drawText(`Rs ${lineTotal.toFixed(2)}`, col.totalX, rowY, rowFontSize);

      const separatorY = rowY - contentHeight - 18;
      page.drawLine({
        start: { x: 42, y: separatorY },
        end: { x: pageWidth - 42, y: separatorY },
        thickness: 1,
        color: rgb(230 / 255, 237 / 255, 245 / 255),
      });
      rowY -= rowHeight;
    });

    // Summary
    let sy = rowY - 10;
    const sx = pageWidth - 260;
    const drawSummary = (label, value, color = darkText, bold = false) => {
      drawText(label, sx, sy, 10, bold, color);
      drawText(value, sx + 120, sy, 10, bold, color);
      sy -= 16;
    };
    drawSummary("Subtotal", `Rs ${subtotal.toFixed(2)}`);
    drawSummary("Discount", `-Rs ${discount.toFixed(2)}`);
    drawSummary("Total Payable", `Rs ${total.toFixed(2)}`, darkText, true);
    drawSummary("Paid Online", `Rs ${paidOnline.toFixed(2)}`, rgb(8 / 255, 127 / 255, 91 / 255));
    drawSummary("Paid Cash", `Rs ${paidCash.toFixed(2)}`, rgb(8 / 255, 127 / 255, 91 / 255));
    drawSummary(
      "Remaining Due",
      `Rs ${remaining.toFixed(2)}`,
      remaining > 0 ? rgb(180 / 255, 35 / 255, 24 / 255) : rgb(8 / 255, 127 / 255, 91 / 255),
      true
    );

    // Footer blocks
    drawText("GSTIN / BANK DETAILS", 42, 228, 10, true, rgb(51 / 255, 78 / 255, 104 / 255));
    drawText("GSTIN: 09AALCV6114A1ZH", 42, 212, 10);
    drawText("IDFC Bank", 42, 198, 10);
    drawText("Sector 18, Noida - 201301", 42, 184, 10);

    drawText("CONTACT DETAILS", 320, 228, 10, true, rgb(51 / 255, 78 / 255, 104 / 255));
    drawText("Email: info@veyona.in", 320, 212, 10);
    drawText("Mob: 9009390054", 320, 198, 10);
    drawText("Address: Sector 27, Noida - 201301", 320, 184, 10);

    drawText("NOTE:", 42, 152, 10, true, rgb(72 / 255, 101 / 255, 129 / 255));
    drawText(
      "We declare that this invoice shows the actual price of the services described and that particulars are true and correct.",
      42,
      138,
      9,
      false,
      rgb(72 / 255, 101 / 255, 129 / 255)
    );

    // Decorative triangles
    page.drawSvgPath("M 420 0 L 595 180 L 595 0 Z", { color: lightBlue });
    page.drawSvgPath("M 470 0 L 595 140 L 595 0 Z", { color: midBlue });
    page.drawSvgPath("M 520 0 L 595 100 L 595 0 Z", { color: blue });

    const pdfBuffer = Buffer.from(await pdfDoc.save());

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error.message || "Could not generate invoice" }, { status: 500 });
  }
}
