"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import AdminHomeTab from "./AdminHomeTab";
import HomeTab from "./HomeTab";
import HomeAboutTab from "./HomeAboutTab";
import AboutTab from "./AboutTab";
import CategoryTab from "./CategoryTab";
import ServiceTab from "./ServiceTab";
import ProductTab from "./ProductTab";
import SalonTab from "./SalonTab";
import EmployeeTab from "./EmployeeTab";
import AppointmentTab from "./AppointmentTab";
import BlogTab from "./BlogTab";
import TestimonialTab from "./TestimonialTab";
import FeaturedProfessionalTab from "./FeaturedProfessionalTab";
import ContactEnquiryTab from "./ContactEnquiryTab";
import CareerApplicationsTab from "./CareerApplicationsTab";
import PartnerRequestsTab from "./PartnerRequestsTab";
import ChatbotDataTab from "./ChatbotDataTab";
import PrivacyTab from "./PrivacyTab";
import TermsTab from "./TermsTab";
import FooterTab from "./FooterTab";
import ThemeTab from "./ThemeTab";
import FaqTab from "./FaqTab";
import AppDownloadTab from "./AppDownloadTab";
import CouponTab from "./CouponTab";
import TrustSignalsTab from "./TrustSignalsTab";
import UsersTab from "./UsersTab";
import ReelTab from "./ReelTab";
import SiteSettingsTab from "./SiteSettingsTab";
import WalletTab from "./WalletTab";
import CustomerFeedbackTab from "./CustomerFeedbackTab";
import AllInvoicesTab from "./AllInvoicesTab";
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
      {/* Sidebar */}
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
  <button
    className={`${styles.menuItem} ${activeTab === "overview" ? styles.active : ""}`}
    onClick={() => setActiveTab("overview")}
  >
    <FiHome className={styles.icon} />
    Overview
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "home" ? styles.active : ""}`}
    onClick={() => setActiveTab("home")}
  >
    <FiHome className={styles.icon} />
    Home Banner
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "home-about" ? styles.active : ""}`}
    onClick={() => setActiveTab("home-about")}
  >
    <FiInfo className={styles.icon} />
    Home About
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "categories" ? styles.active : ""}`}
    onClick={() => setActiveTab("categories")}
  >
    <MdCategory className={styles.icon} />
    Categories
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "services" ? styles.active : ""}`}
    onClick={() => setActiveTab("services")}
  >
    <MdContentCut className={styles.icon} />
    Services
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "products" ? styles.active : ""}`}
    onClick={() => setActiveTab("products")}
  >
    <MdShoppingBag className={styles.icon} />
    Products
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "salons" ? styles.active : ""}`}
    onClick={() => setActiveTab("salons")}
  >
    <MdStore className={styles.icon} />
    Salons & Clinics
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "employees" ? styles.active : ""}`}
    onClick={() => setActiveTab("employees")}
  >
    <FiUsers className={styles.icon} />
    Employees
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "wallets" ? styles.active : ""}`}
    onClick={() => setActiveTab("wallets")}
  >
    <FiCreditCard className={styles.icon} />
    Employee Wallets
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "users" ? styles.active : ""}`}
    onClick={() => setActiveTab("users")}
  >
    <FiUsers className={styles.icon} />
    Users
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "appointments" ? styles.active : ""}`}
    onClick={() => setActiveTab("appointments")}
  >
    <MdEventAvailable className={styles.icon} />
    Appointments
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "customer-feedback" ? styles.active : ""}`}
    onClick={() => setActiveTab("customer-feedback")}
  >
    <FiThumbsUp className={styles.icon} />
    Customer Feedback
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "all-invoices" ? styles.active : ""}`}
    onClick={() => setActiveTab("all-invoices")}
  >
    <FiFileText className={styles.icon} />
    All Invoices
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "coupons" ? styles.active : ""}`}
    onClick={() => setActiveTab("coupons")}
  >
    <FiTag className={styles.icon} />
    Coupons
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "blogs" ? styles.active : ""}`}
    onClick={() => setActiveTab("blogs")}
  >
    <FiFileText className={styles.icon} />
    Blogs
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "reels" ? styles.active : ""}`}
    onClick={() => setActiveTab("reels")}
  >
    <FiSmartphone className={styles.icon} /> {/* Or find a video icon */}
    Reels
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "testimonials" ? styles.active : ""}`}
    onClick={() => setActiveTab("testimonials")}
  >
    <FiStar className={styles.icon} />
    Testimonials
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "featured-professionals" ? styles.active : ""}`}
    onClick={() => setActiveTab("featured-professionals")}
  >
    <MdPersonPin className={styles.icon} />
    Featured Professionals
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "about" ? styles.active : ""}`}
    onClick={() => setActiveTab("about")}
  >
    <FiInfo className={styles.icon} />
    About Us
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "contact-enquiries" ? styles.active : ""}`}
    onClick={() => setActiveTab("contact-enquiries")}
  >
    <FiMail className={styles.icon} />
    Contact Enquiry
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "partner-requests" ? styles.active : ""}`}
    onClick={() => setActiveTab("partner-requests")}
  >
    <FiUsers className={styles.icon} />
    Partner With Us
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "career-applications" ? styles.active : ""}`}
    onClick={() => setActiveTab("career-applications")}
  >
    <FiUsers className={styles.icon} />
    Career Applications
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "chatbot-data" ? styles.active : ""}`}
    onClick={() => setActiveTab("chatbot-data")}
  >
    <FiMessageCircle className={styles.icon} />
    Chatbot Data
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "privacy" ? styles.active : ""}`}
    onClick={() => setActiveTab("privacy")}
  >
    <FiFileText className={styles.icon} />
    Privacy Policy
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "terms" ? styles.active : ""}`}
    onClick={() => setActiveTab("terms")}
  >
    <FiFileText className={styles.icon} />
    Terms & Conditions
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "footer" ? styles.active : ""}`}
    onClick={() => setActiveTab("footer")}
  >
    <FiLayout className={styles.icon} />
    Footer
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "theme" ? styles.active : ""}`}
    onClick={() => setActiveTab("theme")}
  >
    <FiDroplet className={styles.icon} />
    Theme
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "site-settings" ? styles.active : ""}`}
    onClick={() => setActiveTab("site-settings")}
  >
    <FiStar className={styles.icon} />
    Happy Customers
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "trust-signals" ? styles.active : ""}`}
    onClick={() => setActiveTab("trust-signals")}
  >
    <FiShield className={styles.icon} />
    Trust Section
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "faq" ? styles.active : ""}`}
    onClick={() => setActiveTab("faq")}
  >
    <FiHelpCircle className={styles.icon} />
    FAQ Section
  </button>

  <button
    className={`${styles.menuItem} ${activeTab === "app-download" ? styles.active : ""}`}
    onClick={() => setActiveTab("app-download")}
  >
    <FiSmartphone className={styles.icon} />
    App Download
  </button>
</div>


<button className={styles.logout} onClick={logout}>
  <FiLogOut className={styles.icon} />
  Logout
</button>

      </aside>

      {/* Content */}
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
        {activeTab === "overview" && (
          <AdminHomeTab setActiveTab={setActiveTab} />
        )}
        {activeTab === "home" && <HomeTab />}
        {activeTab === "home-about" && <HomeAboutTab />}
        {activeTab === "categories" && <CategoryTab />}
        {activeTab === "services" && <ServiceTab />}
        {activeTab === "products" && <ProductTab />}
        {activeTab === "salons" && <SalonTab />}
        {activeTab === "employees" && <EmployeeTab />}
        {activeTab === "wallets" && <WalletTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "appointments" && <AppointmentTab />}
        {activeTab === "customer-feedback" && <CustomerFeedbackTab />}
        {activeTab === "all-invoices" && <AllInvoicesTab />}
        {activeTab === "coupons" && <CouponTab />}
        {activeTab === "blogs" && <BlogTab />}
        {activeTab === "reels" && <ReelTab />}
        {activeTab === "testimonials" && <TestimonialTab />}
        {activeTab === "featured-professionals" && <FeaturedProfessionalTab />}
        {activeTab === "about" && <AboutTab />}
        {activeTab === "contact-enquiries" && <ContactEnquiryTab />}
        {activeTab === "career-applications" && <CareerApplicationsTab />}
        {activeTab === "partner-requests" && <PartnerRequestsTab />}
        {activeTab === "chatbot-data" && <ChatbotDataTab />}
        {activeTab === "privacy" && <PrivacyTab />}
        {activeTab === "terms" && <TermsTab />}
        {activeTab === "footer" && <FooterTab />}
        {activeTab === "theme" && <ThemeTab />}
        {activeTab === "site-settings" && <SiteSettingsTab />}
        {activeTab === "trust-signals" && <TrustSignalsTab />}
        {activeTab === "faq" && <FaqTab />}
        {activeTab === "app-download" && <AppDownloadTab />}
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
