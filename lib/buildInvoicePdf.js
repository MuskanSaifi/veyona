import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { splitGstInclusive, CGST_RATE, SGST_RATE, COMBINED_GST_RATE } from "@/lib/invoiceGst";
import { amountInWordsINR } from "@/lib/amountInWords";

const HSN_CODE = process.env.INVOICE_HSN_CODE || "999719";
const GST_PERCENT_LABEL = `${(COMBINED_GST_RATE * 100).toFixed(0)}%`;
const COMPANY = {
  name: "Veyona Services Pvt Ltd.",
  tagline: "Clinic & Home Beauty Services",
  address: "Sector 27, Noida - 201301",
  gstin: "09AALCV6114A1ZH",
  email: "info@veyona.in",
  phone: "9009390054",
  bank: "IDFC Bank",
  branch: "Sector 18, Noida - 201301",
  account: process.env.INVOICE_BANK_ACCOUNT || "",
  ifsc: process.env.INVOICE_BANK_IFSC || "",
};

function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`;
}

function fmtRs(n) {
  return Number(n || 0).toFixed(2);
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
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
      : [{ name: apt.service?.name || "Service", price: apt.service?.price || total, quantity: apt.quantity || 1 }];

  const invoiceNo = apt.invoiceNumber || `VEY/${String(apt._id).slice(-8).toUpperCase()}`;
  const bookingNo = String(apt._id || "").slice(-8).toUpperCase() || "-";
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
  const bookingSlot = `${new Date(apt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at ${apt.time || "-"}`;

  const customerName = String(apt.customer?.name || billTo?.name || "Customer");
  const customerPhone = apt.customer?.phone || billTo?.phone || "-";
  const customerEmail = apt.customer?.email || billTo?.email || "-";
  const serviceAt =
    apt.location ||
    [apt.customer?.address, apt.customer?.city, apt.customer?.state, apt.customer?.pincode]
      .filter(Boolean)
      .join(", ") ||
    "-";

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
  const M = 22;
  const W = pageW - M * 2;
  const black = rgb(0, 0, 0);
  const greyBg = rgb(0.9, 0.9, 0.9);
  const greyText = rgb(0.35, 0.35, 0.35);
  const border = 0.7;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text, x, y, size = 8, bold = false, color = black) => {
    page.drawText(String(text ?? ""), { x, y, size, font: bold ? fontBold : font, color });
  };

  const rect = (x, bottom, w, h, fill = null) => {
    page.drawRectangle({
      x,
      y: bottom,
      width: w,
      height: h,
      color: fill || undefined,
      borderColor: black,
      borderWidth: border,
    });
  };

  const vRule = (x, bottom, h) => {
    page.drawLine({ start: { x, y: bottom }, end: { x, y: bottom + h }, thickness: border, color: black });
  };

  const hRule = (x, y, w) => {
    page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: border, color: black });
  };

  /** sectionTop = top edge Y; returns new sectionTop after placing section of height h */
  let sectionTop = pageH - M;

  const placeSection = (h) => {
    const bottom = sectionTop - h;
    return { top: sectionTop, bottom, h };
  };

  const textY = (top, fromTop) => top - fromTop;

  function resolvePublicPath(...parts) {
    const tried = [];
    const roots = [
      process.cwd(),
      path.join(process.cwd(), ".."),
      path.join(process.cwd(), "..", ".."),
      // Fallback to a hard-coded list of common project roots in case Next.js
      // runs with an unexpected working directory (some Turbopack builds use
      // a sub-dir as CWD).
      "E:\\veyona",
      "/var/task",
      "/vercel/path0",
    ];
    for (const root of roots) {
      const full = path.join(root, "public", ...parts);
      tried.push(full);
      try {
        if (existsSync(full)) return full;
      } catch {
        /* ignore */
      }
    }
    // No match — log every path we tried so the team can fix it quickly.
    console.warn(
      `[invoice] resolvePublicPath miss for [${parts.join(", ")}]. cwd=${process.cwd()}. Tried:\n  - ${tried.join("\n  - ")}`
    );
    return path.join(process.cwd(), "public", ...parts);
  }

  async function tryEmbed(filePath, bytes) {
    try {
      if (/\.png$/i.test(filePath)) return await pdfDoc.embedPng(bytes);
      if (/\.(jpe?g)$/i.test(filePath)) return await pdfDoc.embedJpg(bytes);
    } catch (err) {
      console.warn(
        `[invoice] embed failed for ${filePath}: ${err?.message || err}`
      );
      // Try the OTHER format as a recovery (e.g. file renamed)
      try {
        if (/\.png$/i.test(filePath)) return await pdfDoc.embedJpg(bytes);
        if (/\.(jpe?g)$/i.test(filePath)) return await pdfDoc.embedPng(bytes);
      } catch {
        /* give up */
      }
    }
    return null;
  }

  async function loadLogoImage() {
    // Preferred filename first (matches the path the team uses), then fall
    // back to legacy variants so existing assets keep working.
    const relativeCandidates = [
      ["images", "invoice_icon.png"],
      ["images", "invoice_icon.jpg"],
      ["images", "invoice_logo.png"],
      ["images", "invoice-logo.png"],
      ["images", "invoice_logo.jpg"],
      ["images", "invoice-logo.jpg"],
      ["favicon_io", "android-chrome-192x192.png"],
      ["favicon_io", "apple-touch-icon.png"],
      ["header-logo.png"],
      ["footer-logo.png"],
    ];
    console.log(`[invoice] cwd=${process.cwd()}`);
    for (const parts of relativeCandidates) {
      const filePath = resolvePublicPath(...parts);
      let bytes;
      try {
        bytes = await fs.readFile(filePath);
      } catch (err) {
        console.warn(
          `[invoice] read miss: ${filePath} (${err?.code || err?.message || err})`
        );
        continue;
      }
      const img = await tryEmbed(filePath, bytes);
      if (img) {
        console.log(`[invoice] using logo: ${filePath} (${bytes.length} bytes)`);
        return img;
      }
    }
    console.warn("[invoice] no usable logo image found");
    return null;
  }

  // —— 1. Header (logo left + GSTIN/company, TAX INVOICE right) ——
  const HDR_H = 86;
  const hdr = placeSection(HDR_H);
  rect(M, hdr.bottom, W, hdr.h);

  const LOGO_SIZE = 62;
  const LOGO_X = M + 6;
  const logoBottom = hdr.bottom + (hdr.h - LOGO_SIZE) / 2;

  const logoImg = await loadLogoImage();
  if (logoImg) {
    // Preserve aspect ratio while fitting inside an LOGO_SIZE x LOGO_SIZE box.
    const ratio = logoImg.width / logoImg.height || 1;
    let drawW = LOGO_SIZE;
    let drawH = LOGO_SIZE;
    if (ratio >= 1) {
      drawH = LOGO_SIZE / ratio;
    } else {
      drawW = LOGO_SIZE * ratio;
    }
    page.drawImage(logoImg, {
      x: LOGO_X + (LOGO_SIZE - drawW) / 2,
      y: logoBottom + (LOGO_SIZE - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  } else {
    // Fallback: solid brand circle with white "V" so the slot never looks empty.
    const brandBlue = rgb(17 / 255, 55 / 255, 120 / 255);
    page.drawCircle({
      x: LOGO_X + LOGO_SIZE / 2,
      y: logoBottom + LOGO_SIZE / 2,
      size: LOGO_SIZE / 2,
      color: brandBlue,
      borderColor: brandBlue,
      borderWidth: 0.5,
    });
    drawText("V", LOGO_X + LOGO_SIZE / 2 - 4, logoBottom + LOGO_SIZE / 2 - 6, 14, true, rgb(1, 1, 1));
  }

  const infoX = LOGO_X + LOGO_SIZE + 14;
  drawText(`GSTIN : ${COMPANY.gstin}`, infoX, textY(hdr.top, 16), 8);
  drawText(COMPANY.name, infoX, textY(hdr.top, 30), 10, true);
  drawText(COMPANY.tagline, infoX, textY(hdr.top, 44), 7.5, false, greyText);
  drawText(COMPANY.address, infoX, textY(hdr.top, 56), 7.5, false, greyText);
  drawText(`Email : ${COMPANY.email}  |  Mob : ${COMPANY.phone}`, infoX, textY(hdr.top, 68), 7);

  drawText("Original for Recipient", pageW - M - 95, textY(hdr.top, 12), 7.5);
  const taxTitle = "TAX INVOICE";
  drawText(taxTitle, pageW - M - fontBold.widthOfTextAtSize(taxTitle, 15), textY(hdr.top, 28), 15, true);

  sectionTop = hdr.bottom;

  // —— 2. To + Invoice (single box, right split) ——
  const PARTY_H = 88;
  const party = placeSection(PARTY_H);
  rect(M, party.bottom, W, party.h);
  const leftW = W * 0.54;
  const rightW = W - leftW;
  vRule(M + leftW, party.bottom, party.h);

  drawText("To,", M + 8, textY(party.top, 14), 8, true);
  drawText(customerName, M + 8, textY(party.top, 28), 9, true);
  wrapText(serviceAt, font, 7.5, leftW - 16)
    .slice(0, 2)
    .forEach((ln, i) => drawText(ln, M + 8, textY(party.top, 42 + i * 11), 7.5, false, greyText));
  drawText(`Mob : ${customerPhone}`, M + 8, textY(party.top, 66), 7.5);
  drawText(`Email : ${customerEmail}`, M + 8, textY(party.top, 78), 7.5);

  const rx = M + leftW + 8;
  const rightMaxW = rightW - 16;
  drawText(`Invoice Number : ${invoiceNo}`, rx, textY(party.top, 14), 7.5, true);
  drawText(`Invoice Date : ${invoiceDate}`, rx, textY(party.top, 30), 7.5);

  const serviceLabel = "Service At : ";
  const serviceLabelW = fontBold.widthOfTextAtSize(serviceLabel, 7.5);
  drawText(serviceLabel, rx, textY(party.top, 46), 7.5, true);
  const serviceLines = wrapText(serviceAt, font, 7.5, rightMaxW - serviceLabelW);
  serviceLines.slice(0, 3).forEach((ln, i) => {
    drawText(
      ln,
      rx + (i === 0 ? serviceLabelW : 0),
      textY(party.top, 46 + i * 11),
      7.5,
      false,
      greyText
    );
  });

  sectionTop = party.bottom;

  // —— 3. Booking bar ——
  const BOOK_H = 22;
  const book = placeSection(BOOK_H);
  rect(M, book.bottom, W, book.h);
  vRule(M + W / 3, book.bottom, book.h);
  vRule(M + (W * 2) / 3, book.bottom, book.h);
  drawText(`Booking No. : ${bookingNo}`, M + 8, textY(book.top, 14), 7.5, true);
  drawText(`Booking Date : ${bookingSlot}`, M + W / 3 + 8, textY(book.top, 14), 7.5, true);
  drawText(`Payment : ${(apt.payment?.status || "unpaid").toUpperCase()}`, M + (W * 2) / 3 + 8, textY(book.top, 14), 7.5, true);

  sectionTop = book.bottom;

  // —— 4. Items table (fills space until footer blocks) ——
  const FOOTER_BLOCK = 22 + 108 + 44;
  const itemsAreaBottom = M + FOOTER_BLOCK;
  const itemsAreaH = Math.max(120, sectionTop - itemsAreaBottom);

  const cols = [
    { key: "sr", label: "Sr.", w: 24 },
    { key: "description", label: "Description", w: 178 },
    { key: "hsn", label: "HSN CODE", w: 50 },
    { key: "gstPct", label: "GST %", w: 34 },
    { key: "qty", label: "Qty", w: 28 },
    { key: "rate", label: "Rate", w: 48 },
    { key: "discount", label: "Discount", w: 44 },
    { key: "amount", label: "Amount", w: 52 },
  ];
  let tableW = cols.reduce((s, c) => s + c.w, 0);
  if (tableW < W) cols[1].w += W - tableW;
  tableW = W;
  const tableX = M;
  const headerH = 18;
  const subRowH = 20;
  const rowH = 22;
  const fs = 7.5;

  const minDataRows = Math.max(4, lineItems.length);
  const usedH = headerH + minDataRows * rowH + subRowH;
  const itemsH = Math.max(usedH, itemsAreaH);
  const items = { top: sectionTop, bottom: sectionTop - itemsH, h: itemsH };
  rect(M, items.bottom, W, items.h);

  let rowBottom = items.top - headerH;
  rect(tableX, rowBottom, tableW, headerH, greyBg);
  let cx = tableX;
  for (const col of cols) {
    drawText(col.label, cx + 4, rowBottom + 5, 7, true);
    vRule(cx, rowBottom, headerH);
    cx += col.w;
  }
  vRule(tableX + tableW, rowBottom, headerH);

  let totalQty = 0;
  const emptyRows = Math.max(minDataRows, Math.floor((items.h - headerH - subRowH) / rowH));

  for (let i = 0; i < emptyRows; i++) {
    rowBottom -= rowH;
    const row = lineItems[i];
    hRule(tableX, rowBottom + rowH, tableW);
    cx = tableX;
    for (const col of cols) {
      vRule(cx, rowBottom, rowH);
      if (row) {
        if (col.key === "sr") drawText(String(row.sr), cx + 4, rowBottom + 7, fs);
        else if (col.key === "description") {
          wrapText(row.description, font, fs, col.w - 8)
            .slice(0, 2)
            .forEach((ln, li) => drawText(ln, cx + 4, rowBottom + rowH - 12 - li * 10, fs));
        } else if (col.key === "hsn") drawText(row.hsn, cx + 4, rowBottom + 7, fs);
        else if (col.key === "gstPct") drawText(row.gstPct, cx + 4, rowBottom + 7, fs);
        else if (col.key === "qty") {
          totalQty += row.qty;
          drawText(String(row.qty), cx + 4, rowBottom + 7, fs);
        } else if (col.key === "rate") {
          const v = fmtRs(row.rate);
          drawText(v, cx + col.w - font.widthOfTextAtSize(v, fs) - 4, rowBottom + 7, fs);
        } else if (col.key === "discount") {
          if (row.discount > 0) {
            const v = fmtRs(row.discount);
            drawText(v, cx + col.w - font.widthOfTextAtSize(v, fs) - 4, rowBottom + 7, fs);
          }
        } else if (col.key === "amount") {
          const v = fmtRs(row.amount);
          drawText(v, cx + col.w - font.widthOfTextAtSize(v, fs) - 4, rowBottom + 7, fs);
        }
      }
      cx += col.w;
    }
    vRule(tableX + tableW, rowBottom, rowH);
  }

  rowBottom -= subRowH;
  rect(tableX, rowBottom, tableW, subRowH, greyBg);
  drawText("Sub Totals :", tableX + cols[0].w + cols[1].w + 6, rowBottom + 6, 7.5, true);
  drawText(String(totalQty), tableX + cols[0].w + cols[1].w + cols[2].w + cols[3].w + 8, rowBottom + 6, fs, true);
  const subAmt = fmtRs(linesSum - lineDiscount);
  drawText(subAmt, tableX + tableW - font.widthOfTextAtSize(subAmt, fs) - 6, rowBottom + 6, fs, true);

  sectionTop = items.bottom;

  // —— 5. Amount in words ——
  const WORDS_H = 22;
  const words = placeSection(WORDS_H);
  rect(M, words.bottom, W, words.h);
  drawText("Amount in Words :", M + 8, textY(words.top, 14), 8, true);
  drawText(amountInWordsINR(total), M + 108, textY(words.top, 14), 8);
  sectionTop = words.bottom;

  // —— 6. Footer: Bank | Tax | Totals (one row, no overlap) ——
  const FOOT_H = 108;
  const foot = placeSection(FOOT_H);
  rect(M, foot.bottom, W, foot.h);

  const bankW = 125;
  const totW = 168;
  const taxW = W - bankW - totW;
  vRule(M + bankW, foot.bottom, foot.h);
  vRule(M + bankW + taxW, foot.bottom, foot.h);

  drawText("BANK DETAIL", M + 8, textY(foot.top, 14), 7.5, true);
  drawText(`Bank : ${COMPANY.bank}`, M + 8, textY(foot.top, 28), 7);
  drawText(`Branch : ${COMPANY.branch}`, M + 8, textY(foot.top, 40), 7);
  if (COMPANY.account) drawText(`A/c : ${COMPANY.account}`, M + 8, textY(foot.top, 52), 7);
  if (COMPANY.ifsc) drawText(`IFSC : ${COMPANY.ifsc}`, M + 8, textY(foot.top, 64), 7);
  drawText(`GSTIN : ${COMPANY.gstin}`, M + 8, textY(foot.top, 80), 6.5);

  const taxX = M + bankW + 6;
  const taxTableTop = foot.top - 12;
  const tCols = [36, 50, 46, 46, 46];
  const tHead = ["GST %", "Taxable Amt", "SGST Amt", "CGST Amt", "Tax Amt"];
  const tW = Math.min(taxW - 12, tCols.reduce((a, b) => a + b, 0));
  const tRH = 15;
  const taxBottom = foot.bottom + 24;

  rect(taxX, taxBottom + tRH, tW, tRH, greyBg);
  let tx = taxX;
  tHead.forEach((h, i) => {
    drawText(h, tx + 3, taxBottom + tRH + 4, 6.5, true);
    tx += tCols[i];
  });
  rect(taxX, taxBottom, tW, tRH);
  tx = taxX;
  [GST_PERCENT_LABEL, fmtRs(taxable), fmtRs(sgst), fmtRs(cgst), fmtRs(cgst + sgst)].forEach((v, i) => {
    drawText(v, tx + 3, taxBottom + 4, 6.5);
    tx += tCols[i];
  });

  const sumX = M + bankW + taxW + 10;
  let sy = textY(foot.top, 16);
  const sumRow = (label, value, bold = false, highlight = false) => {
    if (highlight) rect(sumX - 2, sy - 4, totW - 16, 15, greyBg);
    drawText(label, sumX, sy, 7.5, bold);
    drawText(value, M + W - font.widthOfTextAtSize(value, 7.5) - 8, sy, 7.5, bold);
    sy -= 13;
  };
  sumRow("Amount", fmtRs(taxable));
  if (discount > 0) sumRow("Discount", fmtRs(discount));
  sumRow("Add : CGST / IGST", fmtRs(cgst));
  sumRow("Add : SGST", fmtRs(sgst));
  sumRow("Total Amount INR", fmtRs(total), true, true);
  sumRow("Paid Online", fmtRs(paidOnline));
  sumRow("Paid Cash", fmtRs(paidCash));
  sumRow("Remaining Due", fmtRs(remaining), remaining > 0);

  sectionTop = foot.bottom;

  // —— 7. Terms + signature ——
  const TERMS_H = 44;
  const terms = placeSection(TERMS_H);
  drawText(
    "Subject to Noida jurisdiction. Services booked are non-refundable as per company policy. E. & O.E.",
    M,
    textY(terms.top, 14),
    6.5,
    false,
    greyText
  );
  drawText("This is a computer-generated tax invoice.", M, textY(terms.top, 26), 6.5, false, greyText);
  drawText(`For ${COMPANY.name}`, pageW - M - 150, textY(terms.top, 20), 8, true);
  drawText("Authorised Signatory", pageW - M - 108, textY(terms.top, 34), 7.5, false, greyText);

  const pageLabel = "Page 1 of 1";
  drawText(pageLabel, (pageW - font.widthOfTextAtSize(pageLabel, 8)) / 2, M - 2, 8, false, greyText);

  return Buffer.from(await pdfDoc.save());
}
