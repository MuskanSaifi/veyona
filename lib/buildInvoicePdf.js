import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { splitGstInclusive, CGST_RATE, SGST_RATE, COMBINED_GST_RATE } from "@/lib/invoiceGst";
import { amountInWordsINR } from "@/lib/amountInWords";

const HSN_CODE = process.env.INVOICE_HSN_CODE || "999719";
const GST_PERCENT_LABEL = `${(COMBINED_GST_RATE * 100).toFixed(0)}%`;
const COMPANY = {
  name: "Veyona Services Pvt Ltd.",
  tagline: "Salon, Clinic & Home Beauty Services",
  address: "Sector 27, Noida - 201301",
  gstin: "09AALCV6114A1ZH",
  email: "info@veyona.in",
  phone: "9009390054",
  bank: "IDFC Bank",
  branch: "Sector 18, Noida - 201301",
};

function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
}

function fmtRs(n) {
  return Number(n || 0).toFixed(2);
}

function wrapText(text, font, size, maxWidth) {
  const raw = String(text ?? "");
  const words = raw.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * @param {object} apt
 * @param {{ name?: string; phone?: string; email?: string }} billTo
 */
export async function buildInvoicePdfBuffer(apt, billTo) {
  const subtotal = Number(apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0);
  const serviceCharge = Number(apt.pricing?.serviceCharge ?? 0);
  const discount = Number(apt.pricing?.discountAmount ?? 0);
  const total = Math.max(
    0,
    Number(apt.pricing?.totalPayable ?? subtotal + serviceCharge - discount)
  );
  const paidOnline = Number(apt.payment?.paidOnline ?? 0);
  const paidCash = Number(apt.payment?.paidCash ?? 0);
  const remaining = Math.max(0, total - paidOnline - paidCash);

  const services =
    Array.isArray(apt.services) && apt.services.length > 0
      ? apt.services
      : [
          {
            name: apt.service?.name || "Service",
            duration: apt.service?.duration || 0,
            price: apt.service?.price || total,
            quantity: apt.quantity || 1,
          },
        ];

  const invoiceNo = apt.invoiceNumber || `VEY/${String(apt._id).slice(-8).toUpperCase()}`;
  const { taxable, cgst, sgst } = splitGstInclusive(total);

  const successfulPayments = Array.isArray(apt.payments)
    ? apt.payments
        .filter((p) => p && (p.status === "captured" || p.status === "recorded") && p.createdAt)
        .map((p) => new Date(p.createdAt))
        .filter((d) => !Number.isNaN(d.getTime()))
    : [];
  const invoiceBaseDate =
    successfulPayments.length > 0
      ? successfulPayments.sort((a, b) => a.getTime() - b.getTime())[0]
      : apt.updatedAt
        ? new Date(apt.updatedAt)
        : apt.createdAt
          ? new Date(apt.createdAt)
          : new Date();

  const invoiceDate = fmtDate(invoiceBaseDate);
  const bookingDate = new Date(apt.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lineItems = [];
  let sr = 0;
  for (const s of services) {
    sr += 1;
    const qty = Math.max(1, Number(s.quantity) || Number(apt.quantity) || 1);
    const rate = Number(s.price) || 0;
    lineItems.push({
      sr,
      description: String(s.name || "Service"),
      hsn: HSN_CODE,
      gstPct: GST_PERCENT_LABEL,
      qty,
      rate,
      discount: 0,
      amount: rate * qty,
    });
  }
  if (serviceCharge > 0) {
    sr += 1;
    lineItems.push({
      sr,
      description: "Service charge",
      hsn: HSN_CODE,
      gstPct: GST_PERCENT_LABEL,
      qty: 1,
      rate: serviceCharge,
      discount: 0,
      amount: serviceCharge,
    });
  }

  const linesSum = lineItems.reduce((s, r) => s + r.amount, 0);
  const lineDiscount = Math.max(0, linesSum - total);
  if (lineDiscount > 0 && lineItems.length > 0) {
    lineItems[lineItems.length - 1].discount = lineDiscount;
    lineItems[lineItems.length - 1].amount = Math.max(
      0,
      lineItems[lineItems.length - 1].amount - lineDiscount
    );
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const pageW = page.getWidth();
  const pageH = page.getHeight();
  const M = 32;
  const W = pageW - M * 2;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0, 0, 0);
  const greyBg = rgb(0.9, 0.9, 0.9);
  const greyText = rgb(0.25, 0.25, 0.25);

  const drawText = (text, x, y, size = 9, bold = false, color = black) => {
    page.drawText(String(text ?? ""), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  const strokeRect = (x, y, w, h, fill = null) => {
    if (fill) page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: black, borderWidth: 0.8 });
    else page.drawRectangle({ x, y, width: w, height: h, borderColor: black, borderWidth: 0.8 });
  };

  const drawHLine = (x, y, w) => {
    page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.8, color: black });
  };

  const drawVLine = (x, y, h) => {
    page.drawLine({ start: { x, y }, end: { x, y: y + h }, thickness: 0.8, color: black });
  };

  let yTop = pageH - M;

  // —— Header ——
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "invoice_logo.png");
    const logoBytes = await fs.readFile(logoPath);
    const logoImg = await pdfDoc.embedPng(logoBytes);
    page.drawImage(logoImg, { x: M, y: yTop - 52, width: 48, height: 48 });
  } catch {
    strokeRect(M, yTop - 52, 48, 48, greyBg);
    drawText("V", M + 18, yTop - 32, 14, true);
  }

  drawText(`GSTIN : ${COMPANY.gstin}`, M + 56, yTop - 14, 8);
  drawText("Original for Recipient", pageW - M - 110, yTop - 14, 8);

  const titleW = fontBold.widthOfTextAtSize("TAX INVOICE", 16);
  drawText("TAX INVOICE", (pageW - titleW) / 2, yTop - 28, 16, true);
  const nameW = fontBold.widthOfTextAtSize(COMPANY.name, 14);
  drawText(COMPANY.name, (pageW - nameW) / 2, yTop - 48, 14, true);
  const tagW = font.widthOfTextAtSize(COMPANY.tagline, 9);
  drawText(COMPANY.tagline, (pageW - tagW) / 2, yTop - 62, 9, false, greyText);
  drawText(COMPANY.address, M + 56, yTop - 76, 8, false, greyText);
  drawText(`Email: ${COMPANY.email}  |  Mob: ${COMPANY.phone}`, M + 56, yTop - 88, 8, false, greyText);

  yTop -= 100;

  // —— Bill-to + Invoice meta (table row) ——
  const metaH = 72;
  strokeRect(M, yTop - metaH, W, metaH);
  drawVLine(M + W * 0.55, yTop - metaH, metaH);

  drawText("To,", M + 8, yTop - 16, 9, true);
  drawText(String(apt.customer?.name || billTo?.name || "Customer"), M + 8, yTop - 30, 10, true);
  const addr =
    apt.location ||
    [apt.customer?.address, apt.customer?.city, apt.customer?.state].filter(Boolean).join(", ");
  if (addr) drawText(addr.slice(0, 90), M + 8, yTop - 44, 8, false, greyText);
  drawText(`Mob: ${apt.customer?.phone || billTo?.phone || "-"}`, M + 8, yTop - 56, 8);
  drawText(`Email: ${apt.customer?.email || billTo?.email || "-"}`, M + 8, yTop - 68, 8);

  const rx = M + W * 0.55 + 8;
  drawText(`Invoice No: ${invoiceNo}`, rx, yTop - 16, 9, true);
  drawText(`Invoice Date: ${invoiceDate}`, rx, yTop - 30, 9);
  drawText(`Booking: ${bookingDate} at ${apt.time || "-"}`, rx, yTop - 44, 8);
  drawText(`Salon: ${apt.salon?.name || "-"}`, rx, yTop - 56, 8);
  drawText(`Payment: ${apt.payment?.status || "unpaid"}`, rx, yTop - 68, 8);

  yTop -= metaH + 8;

  // —— Items table ——
  const cols = [
    { key: "sr", label: "Sr.", w: 26, align: "center" },
    { key: "description", label: "Description", w: 168 },
    { key: "hsn", label: "HSN", w: 48, align: "center" },
    { key: "gstPct", label: "GST %", w: 38, align: "center" },
    { key: "qty", label: "Qty", w: 32, align: "center" },
    { key: "rate", label: "Rate", w: 52, align: "right" },
    { key: "discount", label: "Discount", w: 48, align: "right" },
    { key: "amount", label: "Amount", w: 58, align: "right" },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const tableX = M + (W - tableW) / 2;
  const headerH = 20;
  const rowMinH = 22;
  const fontSize = 8;

  let cx = tableX;
  strokeRect(tableX, yTop - headerH, tableW, headerH, greyBg);
  for (const col of cols) {
    const tw = fontBold.widthOfTextAtSize(col.label, 8);
    const tx =
      col.align === "right"
        ? cx + col.w - tw - 4
        : col.align === "center"
          ? cx + (col.w - tw) / 2
          : cx + 4;
    drawText(col.label, tx, yTop - headerH + 6, 8, true);
    cx += col.w;
  }

  let tableBodyTop = yTop - headerH;
  let totalQty = 0;

  for (const row of lineItems) {
    const descLines = wrapText(row.description, font, fontSize, cols[1].w - 8);
    const rowH = Math.max(rowMinH, descLines.length * 11 + 10);
    tableBodyTop -= rowH;
    strokeRect(tableX, tableBodyTop, tableW, rowH);

    cx = tableX;
    for (const col of cols) {
      drawVLine(cx, tableBodyTop, rowH);
      let val = "";
      if (col.key === "sr") val = String(row.sr);
      else if (col.key === "description") {
        descLines.forEach((ln, i) => drawText(ln, cx + 4, tableBodyTop + rowH - 14 - i * 11, fontSize));
      } else if (col.key === "hsn") val = row.hsn;
      else if (col.key === "gstPct") val = row.gstPct;
      else if (col.key === "qty") {
        val = String(row.qty);
        totalQty += row.qty;
      } else if (col.key === "rate") val = fmtRs(row.rate);
      else if (col.key === "discount") val = row.discount > 0 ? fmtRs(row.discount) : "";
      else if (col.key === "amount") val = fmtRs(row.amount);

      if (col.key !== "description") {
        const tw = font.widthOfTextAtSize(val, fontSize);
        const tx =
          col.align === "right"
            ? cx + col.w - tw - 4
            : col.align === "center"
              ? cx + (col.w - tw) / 2
              : cx + 4;
        drawText(val, tx, tableBodyTop + rowH - 14, fontSize);
      }
      cx += col.w;
    }
    drawVLine(tableX + tableW, tableBodyTop, rowH);
  }

  // Sub-totals row
  const subRowH = 20;
  tableBodyTop -= subRowH;
  strokeRect(tableX, tableBodyTop, tableW, subRowH, greyBg);
  drawText("Sub Totals", tableX + cols[0].w + cols[1].w + 4, tableBodyTop + 6, 8, true);
  const qtyX =
    tableX + cols[0].w + cols[1].w + cols[2].w + cols[3].w + (cols[4].w - fontBold.widthOfTextAtSize(String(totalQty), 8)) / 2;
  drawText(String(totalQty), qtyX, tableBodyTop + 6, 8, true);
  const amtLabel = fmtRs(linesSum - lineDiscount);
  const amtTw = fontBold.widthOfTextAtSize(amtLabel, 8);
  drawText(amtLabel, tableX + tableW - amtTw - 4, tableBodyTop + 6, 8, true);

  yTop = tableBodyTop - 12;

  // —— Footer: amount in words + tax table + totals ——
  const footerH = 142;
  const footerY = yTop - footerH;
  strokeRect(M, footerY, W, footerH);

  drawText("Amount in Words:", M + 8, yTop - 18, 8, true);
  drawText(amountInWordsINR(total).slice(0, 95), M + 8, yTop - 32, 8);

  // Tax breakdown table (left)
  const taxX = M + 8;
  const taxY = footerY + 10;
  const taxCols = [42, 62, 52, 52, 52];
  const taxHeaders = ["GST %", "Taxable Amt", "SGST Amt", "CGST Amt", "Tax Amt"];
  const taxW = taxCols.reduce((a, b) => a + b, 0);
  const taxRowH = 16;
  let tx = taxX;
  strokeRect(taxX, taxY + taxRowH, taxW, taxRowH, greyBg);
  taxHeaders.forEach((h, i) => {
    drawText(h, tx + 3, taxY + taxRowH + 4, 7, true);
    tx += taxCols[i];
  });
  tx = taxX;
  strokeRect(taxX, taxY, taxW, taxRowH);
  const taxVals = [GST_PERCENT_LABEL, fmtRs(taxable), fmtRs(sgst), fmtRs(cgst), fmtRs(cgst + sgst)];
  taxVals.forEach((v, i) => {
    drawText(v, tx + 3, taxY + 4, 7);
    tx += taxCols[i];
  });

  // Totals (right)
  const sumX = pageW - M - 175;
  let sy = yTop - 48;
  const sumLine = (label, value, bold = false) => {
    drawText(label, sumX, sy, 8, bold);
    drawText(value, sumX + 95, sy, 8, bold);
    sy -= 14;
  };
  sumLine("Amount", fmtRs(taxable));
  if (discount > 0) sumLine("Discount", fmtRs(discount));
  sumLine(`Add : CGST @ ${CGST_RATE * 100}%`, fmtRs(cgst));
  sumLine(`Add : SGST @ ${SGST_RATE * 100}%`, fmtRs(sgst));
  page.drawRectangle({
    x: sumX - 4,
    y: sy - 4,
    width: 172,
    height: 18,
    color: greyBg,
    borderColor: black,
    borderWidth: 0.8,
  });
  sumLine("Total Amount INR", fmtRs(total), true);
  sy -= 4;
  sumLine("Paid Online", fmtRs(paidOnline));
  sumLine("Paid Cash", fmtRs(paidCash));
  sumLine("Remaining Due", fmtRs(remaining), remaining > 0);

  // Bank + terms
  const bottomY = footerY - 8;
  strokeRect(M, bottomY - 72, W * 0.42, 72);
  drawText("BANK DETAILS", M + 8, bottomY - 14, 8, true);
  drawText(`Bank: ${COMPANY.bank}`, M + 8, bottomY - 28, 8);
  drawText(`Branch: ${COMPANY.branch}`, M + 8, bottomY - 40, 8);
  drawText(`GSTIN: ${COMPANY.gstin}`, M + 8, bottomY - 52, 8);

  const termsX = M + W * 0.44;
  drawText("Terms & Conditions", termsX, bottomY - 14, 8, true);
  drawText(
    "Services once booked are subject to salon policy. E. & O.E.",
    termsX,
    bottomY - 28,
    7,
    false,
    greyText
  );
  drawText(
    "This is a computer-generated tax invoice.",
    termsX,
    bottomY - 40,
    7,
    false,
    greyText
  );

  drawText(`For ${COMPANY.name}`, pageW - M - 160, bottomY - 40, 9, true);
  drawText("Authorised Signatory", pageW - M - 120, bottomY - 54, 8, false, greyText);

  const pageLabel = "Page 1 of 1";
  const pw = font.widthOfTextAtSize(pageLabel, 8);
  drawText(pageLabel, (pageW - pw) / 2, M - 4, 8, false, greyText);

  return Buffer.from(await pdfDoc.save());
}
