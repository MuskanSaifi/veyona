// Shared styles for admin dashboard tabs

export const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 32,
  paddingBottom: 20,
  borderBottom: "2px solid #e2e8f0",
};

export const pageTitle = {
  fontSize: "32px",
  fontWeight: 700,
  color: "#1e293b",
  margin: 0,
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export const addButton = {
  padding: "12px 24px",
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "24px",
};

export const card = {
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  transition: "all 0.3s ease",
  border: "1px solid #e2e8f0",
};

export const cardHover = {
  transform: "translateY(-4px)",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.06)",
};

export const cardImage = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  borderRadius: "12px",
  marginBottom: "16px",
  border: "1px solid #e2e8f0",
};

export const cardTitle = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "12px",
  color: "#1e293b",
  lineHeight: 1.3,
};

export const cardDescription = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
  marginBottom: "16px",
};

export const badge = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
  marginRight: "8px",
  marginBottom: "8px",
};

export const badgeActive = {
  ...badge,
  background: "#d1fae5",
  color: "#065f46",
};

export const badgeInactive = {
  ...badge,
  background: "#fee2e2",
  color: "#991b1b",
};

export const badgeFeatured = {
  ...badge,
  background: "#dbeafe",
  color: "#1e40af",
};

export const badgeCategory = {
  ...badge,
  background: "#fef3c7",
  color: "#92400e",
};

export const actionButtons = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  flexWrap: "wrap",
};

export const editButton = {
  flex: 1,
  minWidth: "80px",
  padding: "10px 16px",
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.2s ease",
  boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
};

export const toggleButton = {
  flex: 1,
  minWidth: "100px",
  padding: "10px 16px",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.2s ease",
};

export const deleteButton = {
  flex: 1,
  minWidth: "80px",
  padding: "10px 16px",
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 0.2s ease",
  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
};

export const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

export const modal = {
  background: "white",
  padding: "32px",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  border: "1px solid #e2e8f0",
};

export const modalTitle = {
  fontSize: "24px",
  fontWeight: 700,
  marginBottom: "24px",
  color: "#1e293b",
  paddingBottom: "16px",
  borderBottom: "2px solid #e2e8f0",
};

export const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  marginBottom: "16px",
  border: "2px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "15px",
  transition: "all 0.2s ease",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const textareaStyle = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
};

export const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  background: "white",
};

export const modalButtons = {
  display: "flex",
  gap: "12px",
  marginTop: "24px",
};

export const submitButton = {
  flex: 1,
  padding: "14px 24px",
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
};

export const cancelButton = {
  flex: 1,
  padding: "14px 24px",
  background: "#f1f5f9",
  color: "#475569",
  border: "2px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
  background: "white",
  borderRadius: "16px",
  border: "2px dashed #e2e8f0",
};

export const emptyStateText = {
  fontSize: "18px",
  color: "#94a3b8",
  margin: 0,
};

export const filterButton = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export const modalInfo = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "16px",
  background: "#f9fafb",
  borderRadius: "8px",
  marginBottom: "16px",
};

export const linkButton = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  textDecoration: "none",
  display: "inline-block",
};

export const actionButton = {
  padding: "8px 16px",
  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};
// ReelTab specific styles
export const container = {
  padding: "24px",
  maxWidth: "1200px",
  margin: "0 auto",
};

export const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};

export const title = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#1e293b",
  margin: 0,
};

export const list = {
  display: "grid",
  gap: "16px",
};

export const item = {
  background: "white",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

export const itemContent = {
  flex: 1,
};

export const itemActions = {
  display: "flex",
  gap: "8px",
};

export const modalContent = {
  maxWidth: "500px",
  width: "100%",
};

export const formGroup = {
  marginBottom: "16px",
};

export const modalActions = {
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
};




export const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

// Table Styles
export const table = {
  wrapper: {
    background: "#fff",
    borderRadius: "16px",
    padding: "12px 0",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 12px",
    minWidth: "800px",
  },
  th: {
    textAlign: "center",
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    padding: "14px",
    whiteSpace: "nowrap",
  },
  td: {
    textAlign: "center",
    verticalAlign: "middle",
    padding: "18px",
    background: "#fff",
  },
  image: {
    width: "240px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "14px",
    display: "block",
    margin: "0 auto",
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    margin: "0 auto",
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "90px",
    padding: "8px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  btn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "110px",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  text: {
    fontSize: "14px",
    color: "#1f2937",
    margin: 0,
  },
  textSmall: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
};
