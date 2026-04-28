"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./footer.module.css";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";

const DEFAULT_LOGO = "/footer-logo.png";
const DEFAULT_DESCRIPTION = "Your trusted partner for premium salon and dental care services. We bring you the best beauty and wellness experience.";
const DEFAULT_PHONE = "+91 90093 90054";
const DEFAULT_EMAIL = "info@veyona.in";
const DEFAULT_ADDRESS = "Noida";
const DEFAULT_HOURS = "Mon-Sat: 9 AM - 8 PM";
const DEFAULT_COPYRIGHT = "Veyona.in Salon & Clinic. All rights reserved.";

export default function Footer() {
  const [footerData, setFooterData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFooter();
    fetchCategories();
  }, []);

  const fetchFooter = async () => {
    try {
      const res = await fetch("/api/footer");
      const data = await res.json();
      setFooterData(data);
    } catch (error) {
      console.error("Error fetching footer:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const [salonRes, dentistRes, tattooRes] = await Promise.all([
        fetch("/api/category?type=salon"),
        fetch("/api/category?type=dentist"),
        fetch("/api/category?type=tattoo")
      ]);
      
      if (salonRes.ok && dentistRes.ok && tattooRes.ok) {
        const [salonData, dentistData, tattooData] = await Promise.all([
          salonRes.json(),
          dentistRes.json(),
          tattooRes.json()
        ]);
        
        const allCategories = [...salonData, ...dentistData, ...tattooData]
          .filter((cat) => cat.active)
          .slice(0, 6);
        
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const logo = footerData?.logo || DEFAULT_LOGO;
  const description = footerData?.description || DEFAULT_DESCRIPTION;
  const phone = footerData?.phone || DEFAULT_PHONE;
  const email = footerData?.email || DEFAULT_EMAIL;
  const address = footerData?.address || DEFAULT_ADDRESS;
  const hours = footerData?.hours || DEFAULT_HOURS;
  const copyright = footerData?.copyright || DEFAULT_COPYRIGHT;
  const facebookUrl = footerData?.facebookUrl || "https://www.facebook.com/share/1FqbHriLKc/";
  const instagramUrl = footerData?.instagramUrl || "https://www.instagram.com/veyona.in";
  const threadsUrl = footerData?.threadsUrl || "https://www.threads.com/@veyona.in";
  const linkedinUrl = footerData?.linkedinUrl || "https://www.linkedin.com/in/veyona-in-5835643a2";

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <Link href="/" className={styles.footerLogo}>
              <Image
                src={logo}
                alt="Veyona Salon & Clinic"
                width={160}
                height={48}
                className={styles.footerLogoImage}
                unoptimized={logo.startsWith("http")}
              />
            </Link>
            <p className={styles.description}>{description}</p>
            <div className={styles.social}>
              {facebookUrl && (
                <Link
                  href={facebookUrl}
                  className={styles.socialLink}
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebookF />
                </Link>
              )}
              {instagramUrl && (
                <Link
                  href={instagramUrl}
                  className={styles.socialLink}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram />
                </Link>
              )}
              {threadsUrl && (
                <Link
                  href={threadsUrl}
                  className={styles.socialLink}
                  aria-label="Threads"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaThreads />
                </Link>
              )}
              {linkedinUrl && (
                <Link
                  href={linkedinUrl}
                  className={styles.socialLink}
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedinIn />
                </Link>
              )}
            </div>
          </div>
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Quick Links</h4>
            <ul className={styles.links}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Services</h4>
            <ul className={styles.links}>
              {loading ? (
                <li>Loading...</li>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category._id}>
                    <Link href={`/category/${category._id}`}>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/#services">Salon Services</Link></li>
                  <li><Link href="/#services">Dental Care</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Contact Info</h4>
            <ul className={styles.contactInfo}>
              {phone && (
                <li>
                  <FaPhoneAlt /> <span>{phone}</span>
                </li>
              )}
              {email && (
                <li>
                  <FaEnvelope /> <span>{email}</span>
                </li>
              )}
              {address && (
                <li>
                  <FaMapMarkerAlt /> <span>{address}</span>
                </li>
              )}
              {hours && (
                <li>
                  <FaClock /> <span>{hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
   <div className={styles.bottom}>
  <div className={styles.bottomLeft}>
    <p className={styles.copyright}>{copyright}</p>
    <p className={styles.developed}>
      Design & Developed by{" "}
      <a
        href="https://bissgro.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        bissgro.com
      </a>
    </p>
  </div>

  <div className={styles.legal}>
    <Link href="/privacy">Privacy Policy</Link>
    <Link href="/terms">Terms of Service</Link>
  </div>
</div>
      </div>
    </footer>
  );
}
