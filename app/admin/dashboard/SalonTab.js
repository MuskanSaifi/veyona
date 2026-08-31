"use client";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";
import SearchableSelect from "@/app/components/SearchableSelect";
import {
  getIndianStates,
  getStateByName,
  getCitiesForStateCode,
  lookupPincode,
} from "@/lib/indiaLocations";

export default function SalonTab() {
  const [salons, setSalons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    type: "salon",
    openingTime: "09:00",
    closingTime: "18:00",
    image: null,
  });

  const indianStates = useMemo(() => getIndianStates(), []);
  const selectedStateCode = useMemo(() => {
    const st = getStateByName(formData.state);
    return st?.isoCode || "";
  }, [formData.state, indianStates]);

  const cityOptions = useMemo(() => {
    if (!selectedStateCode) return [];
    const names = getCitiesForStateCode(selectedStateCode).map((c) => c.name);
    const current = (formData.city || "").trim();
    if (current && !names.some((n) => n.toLowerCase() === current.toLowerCase())) {
      return [current, ...names];
    }
    return names;
  }, [selectedStateCode, formData.city]);

  const handlePincodeChange = async (val) => {
    const pin = val.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      try {
        const result = await lookupPincode(pin);
        if (result?.success && result.state) {
          setFormData((prev) => ({
            ...prev,
            pincode: pin,
            state: result.state,
            city: result.city || result.district || prev.city,
          }));
        }
      } catch (e) {
        console.error("Salon pincode lookup error:", e);
      }
    }
  };

  const fetchSalons = async () => {
    const res = await fetch("/api/salon");
    const data = await res.json();
    setSalons(data);
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast.error("All fields are required");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== "image" && formData[key]) {
        data.append(key, formData[key]);
      }
    });
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editing) {
        await fetch(`/api/salon/${editing._id}`, {
          method: "PUT",
          body: data,
        });
        toast.success("Salon updated");
      } else {
        await fetch("/api/salon", {
          method: "POST",
          body: data,
        });
        toast.success("Salon added");
      }
      fetchSalons();
      setShowModal(false);
      setEditing(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        type: "salon",
        openingTime: "09:00",
        closingTime: "18:00",
        image: null,
      });
    } catch (error) {
      toast.error("Error saving salon");
    }
  };

  const handleEdit = (salon) => {
    setEditing(salon);
    setFormData({
      name: salon.name,
      email: salon.email,
      phone: salon.phone,
      address: salon.address,
      city: salon.city,
      state: salon.state,
      pincode: salon.pincode,
      type: salon.type,
      openingTime: salon.openingTime,
      closingTime: salon.closingTime,
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this salon?")) return;
    await fetch(`/api/salon/${id}`, { method: "DELETE" });
    toast.success("Salon deleted");
    fetchSalons();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/salon/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchSalons();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Salons & Clinics</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({
              name: "",
              email: "",
              phone: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              type: "salon",
              openingTime: "09:00",
              closingTime: "18:00",
              image: null,
            });
            setShowModal(true);
          }}
          style={styles.addButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
          }}
        >
          <span>+</span> Add Salon/Clinic
        </button>
      </div>

      {salons.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No salons yet. Add your first salon!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {salons.map((salon) => {
            const statusBg = salon.active ? "#dcfce7" : "#fee2e2";
            const statusColor = salon.active ? "#166534" : "#991b1b";
            let typeBg = "#fef3c7";
            let typeColor = "#92400e";
            if (salon.type === "dentist") {
              typeBg = "#dbeafe";
              typeColor = "#1e40af";
            } else if (salon.type === "tattoo") {
              typeBg = "#fce7f3";
              typeColor = "#9f1239";
            }
            return (
              <div key={salon._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{salon.name}</div>
                    <div className={mobile.cardMeta}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: typeBg, color: typeColor, fontWeight: 700, fontSize: 12 }}>
                        {salon.type}
                      </span>
                      {" "}• {salon.city}, {salon.state}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {salon.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Timing:</strong> {salon.openingTime} - {salon.closingTime}
                  <br />
                  <strong>Phone:</strong> {salon.phone}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(salon)}>
                  View More
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className={mobile.hideOnMobile} style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Name</th>
                <th style={styles.table.th}>Address</th>
                <th style={styles.table.th}>Contact</th>
                <th style={styles.table.th}>Type</th>
                <th style={styles.table.th}>Timing</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salons.map((salon) => (
                <tr key={salon._id}>
                  <td style={styles.table.td}>
                    {salon.image ? (
                      <img src={salon.image} alt={salon.name} style={styles.table.image} />
                    ) : (
                      <div
                        style={{
                          width: "240px",
                          height: "100px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                          margin: "0 auto",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{salon.name}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{salon.address}</p>
                    <p style={styles.table.textSmall}>
                      {salon.city}, {salon.state} - {salon.pincode}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{salon.phone}</p>
                    <p style={styles.table.textSmall}>{salon.email}</p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: salon.type === "salon" ? "#fef3c7" : salon.type === "dentist" ? "#dbeafe" : "#fce7f3",
                        color: salon.type === "salon" ? "#92400e" : salon.type === "dentist" ? "#1e40af" : "#9f1239",
                      }}
                    >
                      {salon.type}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {salon.openingTime} - {salon.closingTime}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: salon.active ? "#dcfce7" : "#fee2e2",
                        color: salon.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {salon.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(salon)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(salon._id, salon.active)}
                        style={{
                          ...styles.table.btn,
                          background: salon.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {salon.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(salon._id)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {viewMore && (
        <div className={mobile.modalOverlay} onClick={() => setViewMore(null)}>
          <div className={mobile.modal} onClick={(e) => e.stopPropagation()}>
            <div className={mobile.modalHeader}>
              <div className={mobile.modalTitle}>Salon / Clinic Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Name</div>
                <div className={mobile.detailValue}>{viewMore.name}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Type</div>
                <div className={mobile.detailValue}>{viewMore.type}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Contact</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Phone: {viewMore.phone}</div>
                  <div>Email: {viewMore.email}</div>
                </div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Address</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>{viewMore.address}</div>
                  <div>{viewMore.city}, {viewMore.state} - {viewMore.pincode}</div>
                </div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Timing</div>
                <div className={mobile.detailValue}>{viewMore.openingTime} - {viewMore.closingTime}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Status</div>
                <div className={mobile.detailValue}>{viewMore.active ? "Active" : "Inactive"}</div>
              </div>
              <div className={mobile.modalActions}>
                <button
                  type="button"
                  className={mobile.primaryBtn}
                  onClick={() => {
                    setViewMore(null);
                    handleEdit(viewMore);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={mobile.warnBtn}
                  onClick={() => {
                    toggleActive(viewMore._id, viewMore.active);
                    setViewMore(null);
                  }}
                >
                  {viewMore.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className={mobile.dangerBtn}
                  onClick={() => {
                    handleDelete(viewMore._id);
                    setViewMore(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? "Edit Salon/Clinic" : "Add Salon/Clinic"}</h3>
            <form onSubmit={handleSubmit} style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={styles.textareaStyle}
                rows={2}
                required
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <input
                    type="text"
                    placeholder="Pincode (auto-fills)"
                    value={formData.pincode}
                    maxLength={6}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    style={styles.inputStyle}
                    required
                  />
                </div>
                <div>
                  <SearchableSelect
                    options={indianStates.map((s) => ({ label: s.name, value: s.isoCode, name: s.name }))}
                    value={selectedStateCode}
                    onChange={(code, raw) => {
                      const st = raw?.name ? raw : indianStates.find((s) => s.isoCode === code);
                      setFormData((prev) => ({
                        ...prev,
                        state: st?.name || "",
                        city: "",
                      }));
                    }}
                    placeholder="State"
                    searchPlaceholder="Search state..."
                    required
                  />
                </div>
                <div>
                  <SearchableSelect
                    options={cityOptions}
                    value={formData.city}
                    onChange={(cityName) => {
                      setFormData((prev) => ({ ...prev, city: cityName }));
                    }}
                    placeholder={selectedStateCode ? "City" : "Pick state"}
                    searchPlaceholder="Search city..."
                    disabled={!selectedStateCode}
                    required
                    allowCustom={true}
                  />
                </div>
              </div>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={styles.selectStyle}
                required
              >
                <option value="salon">Salon</option>
                <option value="dentist">Dentist</option>
                <option value="tattoo">Tattoo</option>
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  style={{ ...styles.inputStyle, flex: 1 }}
                  required
                />
                <input
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  style={{ ...styles.inputStyle, flex: 1 }}
                  required
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                style={styles.inputStyle}
              />
              {editing?.image && (
                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "-12px", marginBottom: "16px" }}>
                  Current image will be replaced
                </p>
              )}
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitButton}>
                  {editing ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      city: "",
                      state: "",
                      pincode: "",
                      type: "salon",
                      openingTime: "09:00",
                      closingTime: "18:00",
                      image: null,
                    });
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
