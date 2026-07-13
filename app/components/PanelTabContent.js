"use client";

import AdminHomeTab from "@/app/admin/dashboard/AdminHomeTab";
import HomeTab from "@/app/admin/dashboard/HomeTab";
import HomeAboutTab from "@/app/admin/dashboard/HomeAboutTab";
import AboutTab from "@/app/admin/dashboard/AboutTab";
import CategoryTab from "@/app/admin/dashboard/CategoryTab";
import ServiceTab from "@/app/admin/dashboard/ServiceTab";
import ProductTab from "@/app/admin/dashboard/ProductTab";
import SalonTab from "@/app/admin/dashboard/SalonTab";
import EmployeeTab from "@/app/admin/dashboard/EmployeeTab";
import AppointmentTab from "@/app/admin/dashboard/AppointmentTab";
import BlogTab from "@/app/admin/dashboard/BlogTab";
import TestimonialTab from "@/app/admin/dashboard/TestimonialTab";
import FeaturedProfessionalTab from "@/app/admin/dashboard/FeaturedProfessionalTab";
import ContactEnquiryTab from "@/app/admin/dashboard/ContactEnquiryTab";
import CareerApplicationsTab from "@/app/admin/dashboard/CareerApplicationsTab";
import PartnerRequestsTab from "@/app/admin/dashboard/PartnerRequestsTab";
import ChatbotDataTab from "@/app/admin/dashboard/ChatbotDataTab";
import PrivacyTab from "@/app/admin/dashboard/PrivacyTab";
import TermsTab from "@/app/admin/dashboard/TermsTab";
import FooterTab from "@/app/admin/dashboard/FooterTab";
import ThemeTab from "@/app/admin/dashboard/ThemeTab";
import FaqTab from "@/app/admin/dashboard/FaqTab";
import AppDownloadTab from "@/app/admin/dashboard/AppDownloadTab";
import CouponTab from "@/app/admin/dashboard/CouponTab";
import TrustSignalsTab from "@/app/admin/dashboard/TrustSignalsTab";
import UsersTab from "@/app/admin/dashboard/UsersTab";
import ReelTab from "@/app/admin/dashboard/ReelTab";
import SiteSettingsTab from "@/app/admin/dashboard/SiteSettingsTab";
import WalletTab from "@/app/admin/dashboard/WalletTab";
import CustomerFeedbackTab from "@/app/admin/dashboard/CustomerFeedbackTab";
import PromoBannerTab from "@/app/admin/dashboard/PromoBannerTab";
import AllInvoicesTab from "@/app/admin/dashboard/AllInvoicesTab";

export default function PanelTabContent({ activeTab, setActiveTab }) {
  switch (activeTab) {
    case "overview":
      return <AdminHomeTab setActiveTab={setActiveTab} />;
    case "home":
      return <HomeTab />;
    case "promo-banners":
      return <PromoBannerTab />;
    case "home-about":
      return <HomeAboutTab />;
    case "categories":
      return <CategoryTab />;
    case "services":
      return <ServiceTab />;
    case "products":
      return <ProductTab />;
    case "salons":
      return <SalonTab />;
    case "employees":
      return <EmployeeTab />;
    case "wallets":
      return <WalletTab />;
    case "users":
      return <UsersTab />;
    case "appointments":
      return <AppointmentTab />;
    case "customer-feedback":
      return <CustomerFeedbackTab />;
    case "all-invoices":
      return <AllInvoicesTab />;
    case "coupons":
      return <CouponTab />;
    case "blogs":
      return <BlogTab />;
    case "reels":
      return <ReelTab />;
    case "testimonials":
      return <TestimonialTab />;
    case "featured-professionals":
      return <FeaturedProfessionalTab />;
    case "about":
      return <AboutTab />;
    case "contact-enquiries":
      return <ContactEnquiryTab />;
    case "career-applications":
      return <CareerApplicationsTab />;
    case "partner-requests":
      return <PartnerRequestsTab />;
    case "chatbot-data":
      return <ChatbotDataTab />;
    case "privacy":
      return <PrivacyTab />;
    case "terms":
      return <TermsTab />;
    case "footer":
      return <FooterTab />;
    case "theme":
      return <ThemeTab />;
    case "site-settings":
      return <SiteSettingsTab />;
    case "trust-signals":
      return <TrustSignalsTab />;
    case "faq":
      return <FaqTab />;
    case "app-download":
      return <AppDownloadTab />;
    default:
      return null;
  }
}
