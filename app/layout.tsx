import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import MobileStickyBookButton from "./components/MobileStickyBookButton";
import PromoSitewideBar from "./components/PromoSitewideBar";
import ReduxProvider from "./components/ReduxProvider";
import connectDB from "@/lib/db";
import ThemeSettings from "@/models/ThemeSettings";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veyona Salon & Clinic",
  description: "Premium salon & clinic services – beauty, wellness & care",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },

  manifest: "/favicon_io/site.webmanifest",
};

export const dynamic = "force-dynamic";

async function getThemeCssVariables() {
  try {
    await connectDB();
    const doc = await ThemeSettings.findOne().sort({ createdAt: -1 }).lean();
    if (!doc) return null;

    return `:root{
  --bg-cream:${doc.bgCream || "#F5F0E6"};
  --bg-charcoal:${doc.bgCharcoal || "#333333"};
  --bg-footer-dark:${doc.bgFooterDark || "#222222"};
  --accent-terracotta:${doc.accentTerracotta || "#AD6E5E"};
  --accent-coral:${doc.accentCoral || "#F28F79"};
  --accent-brown:${doc.accentBrown || "#B59A7E"};
  --text-dark:${doc.textDark || "#222222"};
  --text-muted:${doc.textMuted || "#5c5c5c"};
  --border-light:${doc.borderLight || "#e8e4dc"};
}`;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const themeCss = await getThemeCssVariables();

  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3ZYVWQBNNL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3ZYVWQBNNL');
          `}
        </Script>

        {/* Facebook Meta Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '1398193368224553');
            fbq('track', 'PageView');
          `}
        </Script>

        {themeCss ? (
          <style
            id="theme-vars"
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        ) : null}
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* Meta Pixel Noscript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1398193368224553&ev=PageView&noscript=1"
          />
        </noscript>

        <ReduxProvider>
          <Toaster position="top-right" />
          <Header />
          <PromoSitewideBar />
          {children}
          <Footer />
          <Chatbot />
          <WhatsAppFloatingButton />
          <MobileStickyBookButton />
        </ReduxProvider>

      </body>
    </html>
  );
}