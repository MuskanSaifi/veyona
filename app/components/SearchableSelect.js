"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiSearch, FiChevronDown, FiX, FiCheck } from "react-icons/fi";

/**
 * Searchable select / combobox component with an embedded search bar.
 *
 * @param {object} props
 * @param {Array<{ label: string, value: string } | string>} props.options
 * @param {string} props.value
 * @param {(value: string, option?: any) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.searchPlaceholder]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.required]
 * @param {boolean} [props.allowCustom] - Allow user to type and pick custom value if not in options
 * @param {object} [props.style]
 * @param {string} [props.className]
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  disabled = false,
  required = false,
  allowCustom = false,
  style = {},
  className = "",
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options into { label, value } array
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          label: String(opt.label ?? opt.name ?? opt.value ?? ""),
          value: String(opt.value ?? opt.isoCode ?? opt.id ?? ""),
          raw: opt,
        };
      }
      return {
        label: String(opt),
        value: String(opt),
        raw: opt,
      };
    });
  }, [options]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedOptions;
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term)
    );
  }, [normalizedOptions, searchTerm]);

  // Currently selected option object
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      normalizedOptions.find(
        (opt) =>
          opt.value.toLowerCase() === String(value).toLowerCase() ||
          opt.label.toLowerCase() === String(value).toLowerCase()
      ) || { label: String(value), value: String(value) }
    );
  }, [normalizedOptions, value]);

  // Open dropdown and focus search input
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm("");
    setHighlightedIndex(0);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value, opt.raw);
    }
    handleClose();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange("", null);
    }
    setSearchTerm("");
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
      scrollHighlightedIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollHighlightedIntoView();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (allowCustom && searchTerm.trim()) {
        handleSelect({ label: searchTerm.trim(), value: searchTerm.trim() });
      }
    }
  };

  const scrollHighlightedIntoView = () => {
    setTimeout(() => {
      if (!listRef.current) return;
      const el = listRef.current.children[highlightedIndex];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }, 20);
  };

  return (
    <div
      ref={containerRef}
      id={id}
      style={{
        position: "relative",
        width: "100%",
        userSelect: "none",
        ...style,
      }}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        style={{
          width: "100%",
          padding: "11px 14px",
          border: isOpen ? "1.5px solid var(--accent-terracotta, #ea580c)" : "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 15,
          boxSizing: "border-box",
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(234, 88, 12, 0.15)" : "none",
          outline: "none",
        }}
      >
        <span
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: selectedOption ? "#111827" : "#9ca3af",
            fontWeight: selectedOption ? 500 : 400,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {selectedOption && !disabled && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
                color: "#9ca3af",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              <FiX size={15} />
            </button>
          )}
          <FiChevronDown
            size={16}
            style={{
              color: "#6b7280",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </div>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value || ""}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            height: 0,
            width: 0,
            bottom: 0,
          }}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            maxHeight: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Box Header */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid #f3f4f6",
              backgroundColor: "#f9fafb",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiSearch size={15} color="#9ca3af" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 14,
                backgroundColor: "transparent",
                color: "#111827",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            style={{
              overflowY: "auto",
              maxHeight: 220,
              padding: "4px 0",
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  selectedOption?.value.toLowerCase() === opt.value.toLowerCase() ||
                  selectedOption?.label.toLowerCase() === opt.label.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      padding: "8px 14px",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      backgroundColor: isHighlighted
                        ? "#f3f4f6"
                        : isSelected
                        ? "#fef2f2"
                        : "transparent",
                      color: isSelected ? "var(--accent-terracotta, #ea580c)" : "#374151",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <FiCheck size={15} style={{ color: "var(--accent-terracotta, #ea580c)" }} />}
                  </div>
                );
              })
            ) : allowCustom && searchTerm.trim() ? (
              <div
                onClick={() =>
                  handleSelect({ label: searchTerm.trim(), value: searchTerm.trim() })
                }
                style={{
                  padding: "10px 14px",
                  fontSize: 14,
                  cursor: "pointer",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontWeight: 500,
                }}
              >
                Use custom: <strong>&ldquo;{searchTerm.trim()}&rdquo;</strong>
              </div>
            ) : (
              <div
                style={{
                  padding: "14px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
