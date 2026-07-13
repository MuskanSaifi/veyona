/**
 * Shared sidebar menu for Admin panel and Employee panel (permission keys).
 * Employee sees only keys assigned in `employee.permissions`.
 */

export const PANEL_MENU_ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "home", label: "Home Banner" },
  { key: "promo-banners", label: "Promo Banners" },
  { key: "home-about", label: "Home About" },
  { key: "categories", label: "Categories" },
  { key: "services", label: "Services" },
  { key: "products", label: "Products" },
  { key: "salons", label: "Salons & Clinics" },
  { key: "employees", label: "Employees" },
  { key: "wallets", label: "Employee Wallets" },
  { key: "users", label: "Users" },
  { key: "appointments", label: "Appointments" },
  { key: "customer-feedback", label: "Customer Feedback" },
  { key: "all-invoices", label: "All Invoices" },
  { key: "coupons", label: "Coupons" },
  { key: "blogs", label: "Blogs" },
  { key: "reels", label: "Reels" },
  { key: "testimonials", label: "Testimonials" },
  { key: "featured-professionals", label: "Featured Professionals" },
  { key: "about", label: "About Us" },
  { key: "contact-enquiries", label: "Contact Enquiry" },
  { key: "partner-requests", label: "Partner With Us" },
  { key: "career-applications", label: "Career Applications" },
  { key: "chatbot-data", label: "Chatbot Data" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "footer", label: "Footer" },
  { key: "theme", label: "Theme" },
  { key: "site-settings", label: "Happy Customers" },
  { key: "trust-signals", label: "Trust Section" },
  { key: "faq", label: "FAQ Section" },
  { key: "app-download", label: "App Download" },
];

/** Always available on employee panel (not assigned by admin). */
export const EMPLOYEE_CORE_ITEMS = [
  { key: "my-appointments", label: "My Appointments" },
  { key: "service-tracking", label: "Service Tracking", href: "/employee/service-tracking" },
  { key: "my-wallet", label: "My Wallet", href: "/employee/wallet" },
];

export const PANEL_MENU_KEYS = PANEL_MENU_ITEMS.map((i) => i.key);

export function sanitizePermissions(raw) {
  const allowed = new Set(PANEL_MENU_KEYS);
  if (!raw) return [];
  let list = raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : String(raw).split(",");
    } catch {
      list = String(raw).split(",");
    }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((k) => String(k).trim()).filter((k) => allowed.has(k)))];
}
