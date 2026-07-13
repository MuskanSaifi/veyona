"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  FiCalendar,
} from "react-icons/fi";
import {
  MdCategory,
  MdContentCut,
  MdShoppingBag,
  MdStore,
  MdEventAvailable,
  MdPersonPin,
} from "react-icons/md";
import styles from "@/app/admin/dashboard/dashboard.module.css";
import { PANEL_MENU_ITEMS, EMPLOYEE_CORE_ITEMS } from "@/lib/panelMenu";
import PanelTabContent from "@/app/components/PanelTabContent";
import MyAppointmentsTab from "./MyAppointmentsTab";

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
  "my-appointments": FiCalendar,
  "service-tracking": MdEventAvailable,
  "my-wallet": FiCreditCard,
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my-appointments");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/employee/me", { cache: "no-store" });
        if (res.status === 401 || res.status === 403) {
          router.push("/employee/login");
          return;
        }
        const data = await res.json();
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) router.push("/employee/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const permissions = useMemo(
    () => (Array.isArray(me?.permissions) ? me.permissions : []),
    [me]
  );

  const assignedMenu = useMemo(
    () => PANEL_MENU_ITEMS.filter((item) => permissions.includes(item.key)),
    [permissions]
  );

  useEffect(() => {
    if (!me) return;
    const allowed = new Set([
      ...EMPLOYEE_CORE_ITEMS.map((i) => i.key),
      ...permissions,
    ]);
    if (!allowed.has(activeTab)) {
      setActiveTab("my-appointments");
    }
  }, [me, permissions, activeTab]);

  const logout = async () => {
    await fetch("/api/employee/logout");
    router.push("/employee/login");
  };

  const selectTab = (key, href) => {
    if (href) {
      router.push(href);
      return;
    }
    setActiveTab(key);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
        }`}
      >
        <div className={styles.logoRow}>
          <div className={styles.logo}>
            {me?.name ? me.name.split(" ")[0] : "Employee"}
          </div>
          <button
            type="button"
            className={styles.sidebarCloseButton}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className={styles.menu}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.45)",
              padding: "8px 16px 4px",
              textTransform: "uppercase",
            }}
          >
            My work
          </div>
          {EMPLOYEE_CORE_ITEMS.map((item) => {
            const Icon = ICONS[item.key] || FiHome;
            return (
              <button
                key={item.key}
                type="button"
                className={`${styles.menuItem} ${
                  activeTab === item.key ? styles.active : ""
                }`}
                onClick={() => selectTab(item.key, item.href)}
              >
                <Icon className={styles.icon} />
                {item.label}
              </button>
            );
          })}

          {assignedMenu.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "rgba(255,255,255,0.45)",
                  padding: "16px 16px 4px",
                  textTransform: "uppercase",
                }}
              >
                Admin access
              </div>
              {assignedMenu.map((item) => {
                const Icon = ICONS[item.key] || FiHome;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.menuItem} ${
                      activeTab === item.key ? styles.active : ""
                    }`}
                    onClick={() => selectTab(item.key)}
                  >
                    <Icon className={styles.icon} />
                    {item.label}
                  </button>
                );
              })}
            </>
          )}
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
          {activeTab === "my-appointments" && <MyAppointmentsTab />}
          {activeTab !== "my-appointments" &&
            permissions.includes(activeTab) && (
              <PanelTabContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
          {activeTab !== "my-appointments" &&
            !permissions.includes(activeTab) && (
              <div style={{ padding: 24, color: "#64748b" }}>
                Aapke paas is section ka access nahi hai. Admin se permissions
                assign karwayein.
              </div>
            )}
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
