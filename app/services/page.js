"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { addBookingService } from "@/lib/bookingCartSlice";
import styles from "./services.module.css";

const DEFAULT_SERVICE_IMAGE = "/DEFAULT_SERVICE_IMAGE.webp";

export default function AllServicesPage() {
  const dispatch = useDispatch();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [serviceRes, categoryRes] = await Promise.all([
          fetch("/api/service?includeChildren=true"),
          fetch("/api/category"),
        ]);
        const [serviceData, categoryData] = await Promise.all([
          serviceRes.json(),
          categoryRes.json(),
        ]);
        setServices(Array.isArray(serviceData) ? serviceData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        setServices([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((service) => service?.active && service?.price && service?.duration)
      .filter((service) => (categoryFilter === "all" ? true : String(service?.category?._id || service?.category) === categoryFilter))
      .filter((service) => {
        if (!q) return true;
        const name = service?.name?.toLowerCase() || "";
        const desc = service?.description?.toLowerCase() || "";
        const catName = (typeof service?.category === "object" ? service?.category?.name : "")?.toLowerCase() || "";
        return name.includes(q) || desc.includes(q) || catName.includes(q);
      });
  }, [services, categoryFilter, query]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>All Services</h1>
        <p>Choose your service and book in one click.</p>
      </section>

      <section className={styles.filters}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services..."
          className={styles.search}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Categories</option>
          {categories
            .filter((c) => c?.active)
            .map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
        </select>
      </section>

      {loading ? (
        <div className={styles.state}>Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className={styles.state}>No services found for your filters.</div>
      ) : (
        <section className={styles.grid}>
          {filteredServices.map((service) => {
            const categoryName = typeof service?.category === "object" ? service?.category?.name : "";
            return (
              <article key={service._id} className={styles.card}>
                <img
                  src={service.image || DEFAULT_SERVICE_IMAGE}
                  alt={service.name}
                  className={styles.image}
                />
                <div className={styles.content}>
                  {categoryName ? <span className={styles.badge}>{categoryName}</span> : null}
                  <h3>{service.name}</h3>
                  {service.description ? <p>{service.description}</p> : null}
                  <div className={styles.meta}>
                    <span>{service.duration} min</span>
                    <span>₹{service.price}</span>
                  </div>
                  <div className={styles.ctaRow}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => {
                        dispatch(addBookingService(service._id));
                        toast.success("Added to booking cart");
                      }}
                    >
                      Add to cart
                    </button>
                    <Link href={`/book?service=${service._id}`} className={styles.cta}>
                      Continue to book
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
