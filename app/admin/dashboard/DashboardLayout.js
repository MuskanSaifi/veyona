"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import PanelTabContent from "@/app/components/PanelTabContent";
import { PANEL_MENU_ITEMS } from "@/lib/panelMenu";
import {
  FiHome,
  FiLogOut,
  FiUsers,
  FiFileText,
  FiStar,
  FiInfo,
  FiMail,
  FiMessageCircle,
  FiLayout,
  FiDroplet,
  FiHelpCircle,
  FiSmartphone,
  FiMenu,
  FiTag,
  FiShield,
  FiCreditCard,
  FiThumbsUp,
} from "react-icons/fi";
import {
  MdCategory,
  MdContentCut,
  MdShoppingBag,
  MdStore,
  MdEventAvailable,
  MdPersonPin,
} from "react-icons/md";

const ICONS = {
  overview: FiHome,
  home: FiHome,
  "promo-banners": FiTag,
  "home-about": FiInfo,
  categories: MdCategory,
  services: MdContentCut,
  products: MdShoppingBag,
  salons: MdStore,
  employees: FiUsers,
  wallets: FiCreditCard,
  users: FiUsers,
  appointments: MdEventAvailable,
  "customer-feedback": FiThumbsUp,
  "all-invoices": FiFileText,
  coupons: FiTag,
  blogs: FiFileText,
  reels: FiSmartphone,
  testimonials: FiStar,
  "featured-professionals": MdPersonPin,
  about: FiInfo,
  "contact-enquiries": FiMail,
  "partner-requests": FiUsers,
  "career-applications": FiUsers,
  "chatbot-data": FiMessageCircle,
  privacy: FiFileText,
  terms: FiFileText,
  footer: FiLayout,
  theme: FiDroplet,
  "site-settings": FiStar,
  "trust-signals": FiShield,
  faq: FiHelpCircle,
  "app-download": FiSmartphone,
};

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout");
    router.push("/admin/login");
  };

  return (
    <div className={styles.container}>
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
        }`}
      >
        <div className={styles.logoRow}>
          <div className={styles.logo}>Salon Admin</div>
          <button
            type="button"
            className={styles.sidebarCloseButton}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className={styles.menu}>
          {PANEL_MENU_ITEMS.map((item) => {
            const Icon = ICONS[item.key] || FiHome;
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.menuItem} ${
                  activeTab === item.key ? styles.active : ""
                }`}
                onClick={() => {
                  setActiveTab(item.key);
                  setSidebarOpen(false);
                }}
              >
                <Icon className={styles.icon} />
                {item.label}
              </button>
            );
          })}
        </div>

        <button className={styles.logout} onClick={logout}>
          <FiLogOut className={styles.icon} />
          Logout
        </button>
      </aside>

      <main className={styles.content}>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(true)}
        >
          <FiMenu className={styles.icon} />
          <span className={styles.mobileMenuLabel}>Menu</span>
        </button>

        <div className={styles.tabContent}>
          <PanelTabContent activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </main>

      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
