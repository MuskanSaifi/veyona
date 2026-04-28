"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function ProductTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    parentProduct: "",
    order: "",
    image: null,
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/product?includeChildren=true");
    const data = await res.json();
    setProducts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Clear parent product if category changes
    if (formData.category && editing) {
      // Keep parent product if it's in the same category
      const currentParent = products.find(s => s._id === formData.parentProduct);
      if (currentParent && currentParent.category !== formData.category) {
        setFormData(prev => ({ ...prev, parentProduct: "" }));
      }
    }
  }, [formData.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Name and category are required");
      return;
    }

    // Check if this product (if editing) has any children
    let hasChildren = false;
    if (editing) {
      hasChildren = products.some(s => {
        const parentId = typeof s.parentProduct === "string" 
          ? s.parentProduct 
          : s.parentProduct?._id;
        return parentId === editing._id;
      });
    }

    // IMPORTANT: If product has children, it CANNOT have price (it's a grouping product)
    if (hasChildren && formData.price) {
      toast.error("This product has children, so it cannot have price. Only leaf products (products without children) can be buyable.");
      return;
    }

    // Price is optional - grouping products don't need price
    // Only leaf products (products without children) should have price to be buyable

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description || "");
    if (formData.price) data.append("price", formData.price);
    if (formData.originalPrice) data.append("originalPrice", formData.originalPrice);
    data.append("category", formData.category);
    if (formData.parentProduct) {
      data.append("parentProduct", formData.parentProduct);
    }
    if (formData.order) {
      data.append("order", formData.order);
    }
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      let response;
      if (editing) {
        response = await fetch(`/api/product/${editing._id}`, {
          method: "PUT",
          body: data,
        });
      } else {
        response = await fetch("/api/product", {
          method: "POST",
          body: data,
        });
      }

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Error saving product");
        return;
      }

      toast.success(editing ? "Product updated successfully" : "Product added successfully");
      fetchProducts();
      setShowModal(false);
      setEditing(null);
      setFormData({ name: "", description: "", price: "", originalPrice: "", category: "", parentProduct: "", order: "", image: null });
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error saving product. Please try again.");
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    
    // Check if this product has any children
    const hasChildren = products.some(s => {
      const parentId = typeof s.parentProduct === "string" 
        ? s.parentProduct 
        : s.parentProduct?._id;
      return parentId === product._id;
    });
    
    setFormData({
      name: product.name,
      description: product.description || "",
      // If product has children, don't allow price (it's a grouping product)
      price: hasChildren ? "" : (product.price ? product.price.toString() : ""),
      originalPrice: hasChildren ? "" : (product.originalPrice ? product.originalPrice.toString() : ""),
      category: product.category._id || product.category,
      parentProduct: product.parentProduct?._id || product.parentProduct || "",
      order: product.order ? product.order.toString() : "",
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/product/${id}`, { method: "DELETE" });
    toast.success("Product deleted");
    fetchProducts();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/product/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchProducts();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Products</h2>
          <button
            onClick={() => {
              setEditing(null);
              setFormData({ name: "", description: "", price: "", originalPrice: "", category: "", parentProduct: "", order: "", image: null });
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
          <span>+</span> Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No products yet. Add your first product!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {products.map((product) => {
            const statusBg = product.active ? "#dcfce7" : "#fee2e2";
            const statusColor = product.active ? "#166534" : "#991b1b";
            const priceLabel = product.price ? `₹${product.price}` : "N/A";
            return (
              <div key={product._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{product.name}</div>
                    <div className={mobile.cardMeta}>
                      {product.category?.name || "N/A"} • Price: {priceLabel}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Parent:</strong> {product.parentProduct?.name || "—"}
                  <br />
                  <strong>Description:</strong> {product.description ? `${product.description}` : "—"}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(product)}>
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
                <th style={styles.table.th}>Description</th>
                <th style={styles.table.th}>Price</th>
                <th style={styles.table.th}>Category</th>
                <th style={styles.table.th}>Parent Product</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td style={styles.table.td}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={styles.table.image} />
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
                    <p style={styles.table.text}>{product.name}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p
                      style={{
                        ...styles.table.textSmall,
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.description || "N/A"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div>
                      {product.originalPrice != null && product.originalPrice > (product.price || 0) && (
                        <p style={{ ...styles.table.textSmall, color: "#9ca3af", textDecoration: "line-through", marginBottom: 2 }}>
                          ₹{product.originalPrice}
                        </p>
                      )}
                      <p style={{ ...styles.table.text, color: "var(--accent-terracotta)", fontWeight: 600 }}>
                        {product.price ? `₹${product.price}` : "N/A"}
                      </p>
                    </div>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {product.category?.name || "N/A"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {product.parentProduct?.name || "—"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: product.active ? "#dcfce7" : "#fee2e2",
                        color: product.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(product._id, product.active)}
                        style={{
                          ...styles.table.btn,
                          background: product.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {product.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
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
              <div className={mobile.modalTitle}>Product Details</div>
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
                <div className={mobile.detailLabel}>Category</div>
                <div className={mobile.detailValue}>{viewMore.category?.name || "N/A"}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Description</div>
                <div className={mobile.detailValue}>{viewMore.description || "—"}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Pricing</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Original: {viewMore.originalPrice ? `₹${viewMore.originalPrice}` : "—"}</div>
                  <div>Selling: {viewMore.price ? `₹${viewMore.price}` : "—"}</div>
                </div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Other</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Parent product: {viewMore.parentProduct?.name || "—"}</div>
                  <div>Status: {viewMore.active ? "Active" : "Inactive"}</div>
                </div>
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
            <h3 style={styles.modalTitle}>{editing ? "Edit Product" : "Add Product"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textareaStyle}
                rows={3}
              />
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value, parentProduct: "" });
                }}
                style={styles.selectStyle}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
              {/* SubCategory removed */}
              <select
                value={formData.parentProduct}
                onChange={(e) => {
                  const parentSelected = e.target.value;
                  // Don't auto-clear price when parent is selected
                  // Child products CAN be bookable if they are leaf nodes
                  // Price will only be removed if children are added later
                  setFormData({ 
                    ...formData, 
                    parentProduct: parentSelected
                  });
                }}
                style={styles.selectStyle}
                disabled={!formData.category}
              >
                <option value="">Select Parent Product (Optional - for nested products)</option>
                {products
                  .filter((s) => {
                    // Same category
                    const sameCategory = s.category && 
                      (s.category._id === formData.category || s.category === formData.category);
                    
                    if (!sameCategory) return false;
                    
                    // Not the current product being edited
                    const notSelf = !editing || s._id !== editing._id;
                    if (!notSelf) return false;
                    
                    // Prevent circular reference: can't select a product that has this product as its parent (directly or indirectly)
                    if (editing) {
                      let currentProductId = editing._id;
                      let checkParent = s.parentProduct?._id || s.parentProduct;
                      
                      // Check all ancestors to prevent circular reference
                      while (checkParent) {
                        if (checkParent === currentProductId) {
                          return false; // Circular reference found
                        }
                        const parentProduct = products.find(ps => {
                          const psId = typeof ps._id === "string" ? ps._id : ps._id?.toString();
                          return psId === (typeof checkParent === "string" ? checkParent : checkParent?.toString());
                        });
                        if (!parentProduct || !parentProduct.parentProduct) break;
                        checkParent = parentProduct.parentProduct?._id || parentProduct.parentProduct;
                      }
                      
                      // Also check if current product is already a parent of this product
                      const currentProductChildren = products.filter(child => {
                        const childParentId = typeof child.parentProduct === "string" 
                          ? child.parentProduct 
                          : child.parentProduct?._id;
                        return childParentId === currentProductId;
                      });
                      
                      if (currentProductChildren.some(child => {
                        const childId = typeof child._id === "string" ? child._id : child._id?.toString();
                        const sId = typeof s._id === "string" ? s._id : s._id?.toString();
                        return childId === sId;
                      })) {
                        return false; // Can't select a child as parent
                      }
                    }
                    
                    // Allow all products (grouping or leaf nodes) to be selected as parent
                    // Backend will handle removing price from selected parent
                    return true;
                  })
                  .map((parent) => {
                    // Check if this potential parent has children
                    const hasChildren = products.some(child => {
                      const childParentId = typeof child.parentProduct === "string" 
                        ? child.parentProduct 
                        : child.parentProduct?._id;
                      const parentId = typeof parent._id === "string" ? parent._id : parent._id?.toString();
                      return childParentId === parentId && child._id !== (editing?._id || "");
                    });
                    
                    const isLeafNode = parent.price && !hasChildren;
                    const isGrouping = !parent.price;
                    const hasChildrenAndPrice = hasChildren && parent.price;
                    
                    let label = parent.name;
                    if (parent.parentProduct) {
                      label += " (Sub-parent";
                      if (isLeafNode) label += " - leaf node, price will be removed)";
                      else if (hasChildren) label += " - has children)";
                      else label += ")";
                    } else if (isGrouping) {
                      label += " (Parent - grouping product)";
                    } else if (isLeafNode) {
                      label += " (Leaf node - price will be removed when selected as parent)";
                    } else if (hasChildrenAndPrice) {
                      label += " (Has children but also has price - will be fixed)";
                    } else {
                      label += " (Parent)";
                    }
                    
                    return (
                      <option key={parent._id} value={parent._id}>
                        {label}
                      </option>
                    );
                  })}
              </select>
              {(() => {
                // Check if current product (if editing) has children
                const hasChildren = editing ? products.some(s => {
                  const parentId = typeof s.parentProduct === "string" 
                    ? s.parentProduct 
                    : s.parentProduct?._id;
                  return parentId === editing._id;
                }) : false;

                // If product has children, it cannot have price (grouping product)
                if (hasChildren) {
                  return (
                    <div>
                      <input
                        type="number"
                        placeholder="Price (Not allowed - has children)"
                        value=""
                        disabled
                        style={{ ...styles.inputStyle, backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                      />
                      <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontStyle: "italic" }}>
                        ⚠ This product has children, so it cannot have price. Only leaf products (products without children) can be buyable.
                      </p>
                    </div>
                  );
                }

                // If product has a parent, it CAN have price (if it's a leaf node)
                // But it's not required - can be added later or can be a grouping product
                if (formData.parentProduct) {
                  return (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                          type="number"
                          placeholder="Original Price (optional)"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          style={{ ...styles.inputStyle, flex: "1 1 140px" }}
                        />
                        <input
                          type="number"
                          placeholder="Discounted Price (selling price)"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          style={{ ...styles.inputStyle, flex: "1 1 140px" }}
                        />
                      </div>
                      <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px", fontStyle: "italic" }}>
                        ℹ️ Child product: Add price if this is a buyable leaf product. If you add children later, price will be automatically removed.
                      </p>
                    </div>
                  );
                }

                // No parent - top-level product
                // Can have price (buyable product) OR no price (grouping product)
                return (
                  <div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input
                        type="number"
                        placeholder="Original Price (optional)"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        style={{ ...styles.inputStyle, flex: "1 1 140px" }}
                      />
                      <input
                        type="number"
                        placeholder="Discounted Price (selling price)"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        style={{ ...styles.inputStyle, flex: "1 1 140px" }}
                      />
                    </div>
                    <p style={{ fontSize: "12px", color: "#059669", marginTop: "4px", fontStyle: "italic" }}>
                      ✓ Top-level product: Add price to make it buyable (leaf product). Leave empty to create a grouping product (you can add children later). If you add children later, price will be automatically removed.
                    </p>
                  </div>
                );
              })()}
              <input
                type="number"
                placeholder="Order (for sorting, optional)"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                style={styles.inputStyle}
              />
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
                    setFormData({ name: "", description: "", price: "", originalPrice: "", category: "", parentProduct: "", order: "", image: null });
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
