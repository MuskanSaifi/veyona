import { redirect } from "next/navigation";

/**
 * Short public URL for WhatsApp template buttons (employees).
 * Point the template CTA to: https://YOUR_DOMAIN/e
 * so it opens employee login instead of a mistaken admin dashboard link.
 */
export default function EmployeeWhatsAppEntryPage() {
  redirect("/employee/login");
}
