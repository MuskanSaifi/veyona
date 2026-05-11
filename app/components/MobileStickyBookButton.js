"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import styles from "./mobileStickyBookButton.module.css";

export default function MobileStickyBookButton() {
  const pathname = usePathname();
  const bookingServiceIds = useSelector((state) => state.bookingCart.serviceIds) || [];

  const hideOnRoutes = [
    "/book",
    "/admin",
    "/employee",
  ];

  const shouldHide = hideOnRoutes.some((route) => pathname?.startsWith(route));
  if (shouldHide) return null;

  const href = bookingServiceIds.length > 0 ? "/book" : "/services";

  const label = bookingServiceIds.length > 0 ? `Book Now (${bookingServiceIds.length})` : "Book Now";

  return (
    <div className={styles.wrap} aria-label="Sticky booking bar">
      <Link href={href} className={styles.button}>
        {label}
      </Link>
    </div>
  );
}
