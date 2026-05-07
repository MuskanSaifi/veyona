"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  FaChevronDown,
  FaBars,
  FaTimes,
  FaUser,
  FaSearch,
  FaShoppingCart,
  FaCalendarCheck,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUserEdit,
  FaSignOutAlt,
  FaStar,
  FaHandHoldingHeart,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import styles from "./header.module.css";

// Default placeholder image
const DEFAULT_SERVICE_IMAGE = "/DEFAULT_SERVICE_IMAGE.webp";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ services: [], products: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);
  const productsDropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const mobileServicesDropdownRef = useRef(null);
  const mobileProductsDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);
  const profileSidebarRef = useRef(null);
  const bookingServiceIds = useSelector((state) => state.bookingCart.serviceIds) || [];

  useEffect(() => {
    fetchUser();
    fetchCategories();
  }, [pathname]); // Re-fetch user on route change (login/logout redirect)

  useEffect(() => {
    // Always fetch services and products, even if categories are empty
    // This ensures dropdown works even if categories haven't loaded yet
    fetchAllServices();
    fetchAllProducts();
  }, [categories.length]); // Only re-fetch when categories count changes

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery);
      setShowSearchResults(true);
    } else {
      setSearchResults({ services: [], products: [] });
      setShowSearchResults(false);
    }
  }, [searchQuery, services, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle desktop dropdowns if mobile menu is closed
      if (!showMobileMenu) {
        // Check if click is outside Services dropdown (desktop)
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowServicesDropdown(false);
        }
        // Check if click is outside Products dropdown (desktop)
        if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
          setShowProductsDropdown(false);
        }
        // Check if click is outside About dropdown (desktop)
        if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target)) {
          setShowAboutDropdown(false);
        }
      } else {
        // Mobile menu is open - handle mobile dropdowns
        // Check if click is outside mobile Services dropdown
        if (mobileServicesDropdownRef.current && !mobileServicesDropdownRef.current.contains(event.target)) {
          // Don't close if clicking on the Services button itself
          const servicesButton = mobileServicesDropdownRef.current?.querySelector('button');
          if (servicesButton && !servicesButton.contains(event.target)) {
            setShowServicesDropdown(false);
          }
        }
        // Check if click is outside mobile Products dropdown
        if (mobileProductsDropdownRef.current && !mobileProductsDropdownRef.current.contains(event.target)) {
          // Don't close if clicking on the Products button itself
          const productsButton = mobileProductsDropdownRef.current?.querySelector('button');
          if (productsButton && !productsButton.contains(event.target)) {
            setShowProductsDropdown(false);
          }
        }
      }
      
      // Check if click is outside mobile menu (but not on the button itself)
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) &&
          mobileMenuButtonRef.current &&
          !mobileMenuButtonRef.current.contains(event.target)) {
        setShowMobileMenu(false);
        // Also close dropdowns when mobile menu closes
        setShowServicesDropdown(false);
        setShowProductsDropdown(false);
        setShowAboutDropdown(false);
      }
      
      // Check if click is outside search results
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target) && 
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }

      // Close profile sidebar if clicked outside
      if (
        showProfileSidebar &&
        profileSidebarRef.current &&
        !profileSidebarRef.current.contains(event.target)
      ) {
        setShowProfileSidebar(false);
      }
    };

    // Use mousedown for better compatibility
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu, showProfileSidebar]);

  const handleLogout = async () => {
    try {
      await fetch("/api/user/logout");
    } catch (e) {}
    setUser(null);
    setShowProfileSidebar(false);
    setShowMobileMenu(false);
    router.push("/user/login");
  };

  const sidebarItems = [
    { key: "profile", label: "Update profile", icon: FaUserEdit, href: "/user/profile" },
    { key: "orders", label: "My orders", icon: FaClipboardList, href: "/user/orders" },
    { key: "consultations", label: "My consultations", icon: FaCalendarCheck, href: "/user/dashboard" },
    { key: "addresses", label: "My addresses", icon: FaMapMarkerAlt, href: "/user/addresses" },
    { key: "refer", label: "Refer a friend", icon: FaHandHoldingHeart, href: "/user/refer" },
    { key: "rate", label: "Rate us", icon: FaStar, href: "/user/rate" },
  ];

  const performSearch = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Search services - only bookable services (with price and duration)
    const matchedServices = services
      .filter((service) => {
        const isBookableService = service.price && service.duration;
        if (!isBookableService || !service.active) return false;
        
        const nameMatch = service.name?.toLowerCase().includes(lowerQuery);
        const descMatch = service.description?.toLowerCase().includes(lowerQuery);
        const categoryName = typeof service.category === 'object' 
          ? service.category?.name 
          : categories.find(c => c._id === service.category)?.name;
        const categoryMatch = categoryName?.toLowerCase().includes(lowerQuery);
        
        return nameMatch || descMatch || categoryMatch;
      })
      .slice(0, 20); // Limit to 20 results

    // Search products - only buyable products (with price, no parent)
    const matchedProducts = products
      .filter((product) => {
        const isBuyableProduct = product.price && product.price > 0 && !product.parentProduct;
        if (!isBuyableProduct || !product.active) return false;
        
        const nameMatch = product.name?.toLowerCase().includes(lowerQuery);
        const descMatch = product.description?.toLowerCase().includes(lowerQuery);
        const categoryName = typeof product.category === 'object' 
          ? product.category?.name 
          : categories.find(c => c._id === product.category)?.name;
        const categoryMatch = categoryName?.toLowerCase().includes(lowerQuery);
        
        return nameMatch || descMatch || categoryMatch;
      })
      .slice(0, 20); // Limit to 20 results

    setSearchResults({
      services: matchedServices,
      products: matchedProducts,
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or show all results
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery("");
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        return;
      }
      // If not authenticated (or any error), clear stale header state
      setUser(null);
    } catch (error) {
      // User not logged in
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const [salonRes, dentistRes, tattooRes] = await Promise.all([
        fetch("/api/category?type=salon"),
        fetch("/api/category?type=dentist"),
        fetch("/api/category?type=tattoo")
      ]);
      
      if (!salonRes.ok || !dentistRes.ok || !tattooRes.ok) {
        throw new Error("Failed to fetch categories");
      }
      
      const [salonData, dentistData, tattooData] = await Promise.all([
        salonRes.json(),
        dentistRes.json(),
        tattooRes.json()
      ]);
      
      const allCategories = [...salonData, ...dentistData, ...tattooData].filter((cat) => cat.active);
      setCategories(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchAllServices = async () => {
    try {
      const res = await fetch("/api/service?includeChildren=true");
      if (!res.ok) {
        throw new Error("Failed to fetch services");
      }
      const data = await res.json();
      const activeServices = data.filter((s) => s.active);
      setServices(activeServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch("/api/product?includeChildren=true");
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      const activeProducts = data.filter((p) => p.active);
      setProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // Check if service is bookable (has price and duration - these are the only bookable services)
  const isBookable = (service) => {
    // Only services with price and duration are bookable
    // Parent services (without price/duration) are not bookable
    return service.price && service.duration;
  };

  // Check if product is buyable (has price)
  const isBuyable = (product) => {
    return product.price && product.price > 0;
  };

  // Organize services hierarchically: Category → Parent Service → Bookable Services
  const organizeServicesHierarchy = () => {
    if (!categories.length || !services.length) return [];

    // Organize services by parent-child relationship
    const organizeByParent = (serviceList) => {
      const parentServices = serviceList.filter((s) => !s.parentService);
      const childServicesMap = new Map();

      serviceList.forEach((service) => {
        if (service.parentService) {
          const parentId =
            typeof service.parentService === "string"
              ? service.parentService
              : service.parentService._id;

          if (!childServicesMap.has(parentId)) {
            childServicesMap.set(parentId, []);
          }
          childServicesMap.get(parentId).push(service);
        }
      });

      return { parentServices, childServicesMap };
    };

    return categories
      .filter((category) => category.active)
      .map((category) => {
        // Get all services for this category
        const categoryServices = services.filter(
          (service) => 
            (typeof service.category === "string" &&
              service.category === category._id) ||
            (service.category?._id === category._id) ||
            (service.category?._id?.toString() === category._id?.toString())
        );

        if (!categoryServices.length) return null;

        const { parentServices, childServicesMap } =
          organizeByParent(categoryServices);

        // Get parent service IDs that have bookable children
        const parentIdsWithChildren = new Set(
          parentServices
            .filter((parent) => {
              const children = (childServicesMap.get(parent._id) || []).filter(isBookable);
              return children.length > 0;
            })
            .map((p) => p._id.toString())
        );

        const processedParentServices = parentServices
          .map((parent) => ({
            ...parent,
            children: (childServicesMap.get(parent._id) || []).filter(isBookable),
          }))
          .filter((parent) => parent.children.length > 0);

        // Direct bookable services: no parent, bookable, AND not already shown as parent
        const directBookableServices = categoryServices.filter((s) => {
          const serviceId = s._id.toString();
          return !s.parentService && isBookable(s) && !parentIdsWithChildren.has(serviceId);
        });

        return {
          category,
          parentServices: processedParentServices,
          directBookableServices,
        };
      })
      .filter(
        (item) =>
          item &&
          (item.parentServices.length > 0 ||
            item.directBookableServices.length > 0)
      );
  };

  // Organize products hierarchically: Category → Parent Product → Buyable Products
  const organizeProductsHierarchy = () => {
    if (!categories.length || !products.length) return [];

    // Organize products by parent-child relationship
    const organizeByParent = (productList) => {
      const parentProducts = productList.filter((p) => !p.parentProduct);
      const childProductsMap = new Map();

      productList.forEach((product) => {
        if (product.parentProduct) {
          const parentId =
            typeof product.parentProduct === "string"
              ? product.parentProduct
              : product.parentProduct._id;

          if (!childProductsMap.has(parentId)) {
            childProductsMap.set(parentId, []);
          }
          childProductsMap.get(parentId).push(product);
        }
      });

      return { parentProducts, childProductsMap };
    };

    return categories
      .filter((category) => category.active)
      .map((category) => {
        // Get all products for this category
        const categoryProducts = products.filter(
          (product) => 
            (typeof product.category === "string" &&
              product.category === category._id) ||
            (product.category?._id === category._id) ||
            (product.category?._id?.toString() === category._id?.toString())
        );

        if (!categoryProducts.length) return null;

        const { parentProducts, childProductsMap } =
          organizeByParent(categoryProducts);

        // Get parent product IDs that have buyable children
        const parentIdsWithChildren = new Set(
          parentProducts
            .filter((parent) => {
              const children = (childProductsMap.get(parent._id) || []).filter(isBuyable);
              return children.length > 0;
            })
            .map((p) => p._id.toString())
        );

        const processedParentProducts = parentProducts
          .map((parent) => ({
            ...parent,
            children: (childProductsMap.get(parent._id) || []).filter(isBuyable),
          }))
          .filter((parent) => parent.children.length > 0);

        // Direct buyable products: no parent, buyable, AND not already shown as parent
        const directBuyableProducts = categoryProducts.filter((p) => {
          const productId = p._id.toString();
          return !p.parentProduct && isBuyable(p) && !parentIdsWithChildren.has(productId);
        });

        return {
          category,
          parentProducts: processedParentProducts,
          directBuyableProducts,
        };
      })
      .filter(
        (item) =>
          item &&
          (item.parentProducts.length > 0 ||
            item.directBuyableProducts.length > 0)
      );
  };

  const servicesHierarchy = organizeServicesHierarchy();
  const productsHierarchy = organizeProductsHierarchy();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* LOGO */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/header-logo.png"
            alt="Veyona Salon & Dental Clinic Logo"
            width={150}
            height={55}
            className={styles.logoImage}
            priority
          />
          {/* <span className={styles.logoText}>Veyona</span> */}
        </Link>

        {/* Search Bar */}
        <div className={styles.searchContainer} ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search services & products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className={styles.searchClear}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && (searchResults.services.length > 0 || searchResults.products.length > 0) && (
            <div className={styles.searchResults} ref={searchResultsRef}>
              {searchResults.services.length > 0 && (
                <div className={styles.searchResultsSection}>
                  <div className={styles.searchResultsTitle}>Services</div>
                  {searchResults.services.map((service) => (
                    <Link
                      key={service._id}
                      href={`/book?service=${service._id}`}
                      className={styles.searchResultItem}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className={styles.searchResultImage}>
                        <Image
                          src={service.image || DEFAULT_SERVICE_IMAGE}
                          alt={service.name}
                          width={40}
                          height={40}
                          className={styles.serviceImage}
                          onError={(e) => {
                            e.target.src = DEFAULT_SERVICE_IMAGE;
                          }}
                        />
                      </div>
                      <div className={styles.searchResultInfo}>
                        <div className={styles.searchResultName}>{service.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.products.length > 0 && (
                <div className={styles.searchResultsSection}>
                  <div className={styles.searchResultsTitle}>Products</div>
                  {searchResults.products.map((product) => (
                    <a
                      key={product._id}
                      href={`https://wa.me/919009390054?text=${encodeURIComponent(`Hello! I'm interested in purchasing:\n\nProduct: ${product.name}\nPrice: ₹${product.price}${product.description ? `\nDescription: ${product.description}` : ''}\n\nPlease provide more details.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.searchResultItem}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className={styles.searchResultImage}>
                        <Image
                          src={product.image || DEFAULT_SERVICE_IMAGE}
                          alt={product.name}
                          width={40}
                          height={40}
                          className={styles.serviceImage}
                          onError={(e) => {
                            e.target.src = DEFAULT_SERVICE_IMAGE;
                          }}
                        />
                      </div>
                      <div className={styles.searchResultInfo}>
                        <div className={styles.searchResultName}>{product.name}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop NAV */}
        <nav className={styles.nav}>
          <Link
            href="/"
            className={`${styles.navLink} ${
              pathname === "/" ? styles.active : ""
            }`}
          >
            Home
          </Link>

          <Link
            href="/services"
            className={`${styles.navLink} ${
              pathname === "/services" ? styles.active : ""
            }`}
          >
            All Services
          </Link>

          {/* Services Dropdown - Mega Menu */}
          <div
            className={styles.dropdown}
            ref={dropdownRef}
            onMouseEnter={() => {
              setShowServicesDropdown(true);
              setShowProductsDropdown(false);
              setShowAboutDropdown(false);
            }}
          >
            <button className={`${styles.navLink} ${styles.dropdownButton}`}>
              Services
              <FaChevronDown className={styles.chevron} />
            </button>
            {showServicesDropdown && servicesHierarchy.length > 0 && (
              <div 
                className={`${styles.dropdownMenu} ${servicesHierarchy.length === 4 ? styles.dropdownMenu4Col : ""}`}
                onMouseEnter={() => setShowServicesDropdown(true)}
              >
                {servicesHierarchy.map((categoryGroup) => (
                  <div
                    key={categoryGroup.category._id}
                    className={styles.dropdownSection}
                  >
                    {/* Category Title */}
                    <div className={styles.dropdownSectionTitle}>
                      {categoryGroup.category.name}
                    </div>

                    {/* Parent Services (only those with bookable children) */}
                    {categoryGroup.parentServices.map((parent) => (
                      <div key={parent._id} className={styles.dropdownParentItem}>
                        <div className={styles.dropdownParentTitle}>
                          {parent.name}
                        </div>
                        {parent.children.map((child) => (
                          <Link
                            key={child._id}
                            href={`/book?service=${child._id}`}
                            className={styles.dropdownChildItem}
                            onClick={() => setShowServicesDropdown(false)}
                          >
                            <div className={styles.serviceImageWrapper}>
                              <Image
                                src={child.image || DEFAULT_SERVICE_IMAGE}
                                alt={child.name}
                                width={40}
                                height={40}
                                className={styles.serviceImage}
                                onError={(e) => {
                                  e.target.src = DEFAULT_SERVICE_IMAGE;
                                }}
                              />
                            </div>
                            <div className={styles.serviceInfo}>
                              <span className={styles.serviceName}>
                                {child.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}

                    {/* Direct Bookable Services */}
                    {categoryGroup.directBookableServices.map((service) => (
                      <Link
                        key={service._id}
                        href={`/book?service=${service._id}`}
                        className={styles.dropdownItem}
                        onClick={() => setShowServicesDropdown(false)}
                      >
                        <div className={styles.serviceImageWrapper}>
                          <Image
                            src={service.image || DEFAULT_SERVICE_IMAGE}
                            alt={service.name}
                            width={40}
                            height={40}
                            className={styles.serviceImage}
                            onError={(e) => {
                              e.target.src = DEFAULT_SERVICE_IMAGE;
                            }}
                          />
                        </div>
                        <div className={styles.serviceInfo}>
                          <span className={styles.serviceName}>
                            {service.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Dropdown - Mega Menu (main label links to #products so tap/click always works) */}
          <div
            className={styles.dropdown}
            ref={productsDropdownRef}
            onMouseEnter={() => {
              setShowProductsDropdown(true);
              setShowServicesDropdown(false);
              setShowAboutDropdown(false);
            }}
          >
            <Link
              href="/#products"
              className={`${styles.navLink} ${styles.dropdownButton}`}
              onClick={() => {
                setShowProductsDropdown(false);
                setShowServicesDropdown(false);
                setShowAboutDropdown(false);
              }}
            >
              Products
              <FaChevronDown className={styles.chevron} />
            </Link>
            {showProductsDropdown && productsHierarchy.length > 0 && (
              <div 
                className={`${styles.dropdownMenu} ${productsHierarchy.length === 4 ? styles.dropdownMenu4Col : ""}`}
                onMouseEnter={() => setShowProductsDropdown(true)}
              >
                {productsHierarchy.map((categoryGroup) => (
                  <div
                    key={categoryGroup.category._id}
                    className={styles.dropdownSection}
                  >
                    {/* Category Title */}
                    <div className={styles.dropdownSectionTitle}>
                      {categoryGroup.category.name}
                    </div>

                    {/* Parent Products (only those with buyable children) */}
                    {categoryGroup.parentProducts.map((parent) => (
                      <div key={parent._id} className={styles.dropdownParentItem}>
                        <div className={styles.dropdownParentTitle}>
                          {parent.name}
                        </div>
                        {parent.children.map((child) => (
                          <Link
                            key={child._id}
                            href={`/#products`}
                            className={styles.dropdownChildItem}
                            onClick={() => setShowProductsDropdown(false)}
                          >
                            <div className={styles.serviceImageWrapper}>
                              <Image
                                src={child.image || DEFAULT_SERVICE_IMAGE}
                                alt={child.name}
                                width={40}
                                height={40}
                                className={styles.serviceImage}
                                onError={(e) => {
                                  e.target.src = DEFAULT_SERVICE_IMAGE;
                                }}
                              />
                            </div>
                            <div className={styles.serviceInfo}>
                              <span className={styles.serviceName}>
                                {child.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}

                    {/* Direct Buyable Products */}
                    {categoryGroup.directBuyableProducts.map((product) => (
                      <Link
                        key={product._id}
                        href={`/#products`}
                        className={styles.dropdownItem}
                        onClick={() => setShowProductsDropdown(false)}
                      >
                        <div className={styles.serviceImageWrapper}>
                          <Image
                            src={product.image || DEFAULT_SERVICE_IMAGE}
                            alt={product.name}
                            width={40}
                            height={40}
                            className={styles.serviceImage}
                            onError={(e) => {
                              e.target.src = DEFAULT_SERVICE_IMAGE;
                            }}
                          />
                        </div>
                        <div className={styles.serviceInfo}>
                          <span className={styles.serviceName}>
                            {product.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Us Dropdown */}
          <div
            className={styles.dropdown}
            ref={aboutDropdownRef}
            onMouseEnter={() => {
              setShowAboutDropdown(true);
              setShowServicesDropdown(false);
              setShowProductsDropdown(false);
            }}
          >
            <button className={`${styles.navLink} ${styles.dropdownButton}`}>
              About Us
              <FaChevronDown className={styles.chevron} />
            </button>
            {showAboutDropdown && (
              <div
                className={styles.simpleDropdownMenu}
                onMouseEnter={() => setShowAboutDropdown(true)}
              >
                <Link
                  href="/about"
                  className={styles.simpleDropdownItem}
                  onClick={() => setShowAboutDropdown(false)}
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className={styles.simpleDropdownItem}
                  onClick={() => setShowAboutDropdown(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/career"
                  className={styles.simpleDropdownItem}
                  onClick={() => setShowAboutDropdown(false)}
                >
                  Careers
                </Link>
                <Link
                  href="/partner-with-us"
                  className={styles.simpleDropdownItem}
                  onClick={() => setShowAboutDropdown(false)}
                >
                  Partner With Us
                </Link>
              </div>
            )}
          </div>

          {bookingServiceIds.length > 0 && (
      <Link
      href={
        bookingServiceIds.length === 1
          ? `/book?service=${bookingServiceIds[0]}`
          : `/book?services=${bookingServiceIds.join(",")}`
      }
      className={styles.navLink}
      title="Back to book appointment"
    >
      <FaShoppingCart className={styles.userIcon} />
      <span>Cart</span>
      <span className={styles.bookingCount}>{bookingServiceIds.length}</span>
    </Link>
          )}

          {user ? (
            <button
              type="button"
              className={`${styles.navLink} ${styles.userLink}`}
              onClick={() => {
                setShowProfileSidebar(true);
                setShowMobileMenu(false);
              }}
              aria-label="Open profile menu"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt=""
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 999,
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                />
              ) : (
                <FaUser className={styles.userIcon} />
              )}
              {user.name || user.phone}
            </button>
          ) : (
            <Link
              href="/user/login"
              className={`${styles.navLink} ${styles.loginLink}`}
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          ref={mobileMenuButtonRef}
          className={styles.mobileMenuButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMobileMenu(!showMobileMenu);
          }}
          aria-label="Toggle menu"
          type="button"
        >
          {showMobileMenu ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className={styles.mobileMenu} ref={mobileMenuRef}>
          {/* Mobile Search */}
          <div className={styles.mobileSearchContainer}>
            <form onSubmit={handleSearchSubmit} className={styles.mobileSearchForm}>
              <div className={styles.mobileSearchInputWrapper}>
                <FaSearch className={styles.mobileSearchIcon} />
                <input
                  type="text"
                  placeholder="Search services & products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.mobileSearchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    className={styles.mobileSearchClear}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Search Results */}
            {showSearchResults && (searchResults.services.length > 0 || searchResults.products.length > 0) && (
              <div className={styles.mobileSearchResults}>
                {searchResults.services.length > 0 && (
                  <div>
                    <div className={styles.mobileSearchResultsTitle}>Services</div>
                    {searchResults.services.map((service) => (
                      <Link
                        key={service._id}
                        href={`/book?service=${service._id}`}
                        className={styles.mobileSearchResultItem}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                          setShowMobileMenu(false);
                        }}
                      >
                        <div className={styles.mobileSearchResultImage}>
                          <Image
                            src={service.image || DEFAULT_SERVICE_IMAGE}
                            alt={service.name}
                            width={40}
                            height={40}
                            className={styles.serviceImage}
                            onError={(e) => {
                              e.target.src = DEFAULT_SERVICE_IMAGE;
                            }}
                          />
                        </div>
                        <div className={styles.mobileSearchResultInfo}>
                          <div className={styles.mobileSearchResultName}>{service.name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.products.length > 0 && (
                  <div>
                    <div className={styles.mobileSearchResultsTitle}>Products</div>
                    {searchResults.products.map((product) => (
                      <a
                        key={product._id}
                        href={`https://wa.me/919009390054?text=${encodeURIComponent(`Hello! I'm interested in purchasing:\n\nProduct: ${product.name}\nPrice: ₹${product.price}${product.description ? `\nDescription: ${product.description}` : ''}\n\nPlease provide more details.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.mobileSearchResultItem}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery("");
                          setShowMobileMenu(false);
                        }}
                      >
                        <div className={styles.mobileSearchResultImage}>
                          <Image
                            src={product.image || DEFAULT_SERVICE_IMAGE}
                            alt={product.name}
                            width={40}
                            height={40}
                            className={styles.serviceImage}
                            onError={(e) => {
                              e.target.src = DEFAULT_SERVICE_IMAGE;
                            }}
                          />
                        </div>
                        <div className={styles.mobileSearchResultInfo}>
                          <div className={styles.mobileSearchResultName}>{product.name}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            href="/"
            className={`${styles.mobileNavLink} ${
              pathname === "/" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            Home
          </Link>

          <Link
            href="/services"
            className={`${styles.mobileNavLink} ${
              pathname === "/services" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            All Services
          </Link>

          <div className={styles.mobileDropdown} ref={mobileServicesDropdownRef}>
            <button
              className={styles.mobileDropdownButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowServicesDropdown(!showServicesDropdown);
                setShowProductsDropdown(false);
              }}
            >
              Services <FaChevronDown className={showServicesDropdown ? styles.rotated : ""} />
            </button>
            {showServicesDropdown && servicesHierarchy.length > 0 && (
              <div className={styles.mobileDropdownMenu}>
                {servicesHierarchy.map((categoryGroup) => (
                  <div key={categoryGroup.category._id}>
                    <div className={styles.mobileDropdownSectionTitle}>
                      {categoryGroup.category.name}
                    </div>

                    {/* Parent Services (only those with bookable children) */}
                    {categoryGroup.parentServices.map((parent) => (
                      <div key={parent._id}>
                        <div className={styles.mobileDropdownParentTitle}>
                          {parent.name}
                        </div>
                        {parent.children.map((child) => (
                          <Link
                            key={child._id}
                            href={`/book?service=${child._id}`}
                            className={styles.mobileDropdownChildItem}
                            onClick={() => {
                              setShowServicesDropdown(false);
                              setShowMobileMenu(false);
                            }}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ))}

                    {/* Direct Bookable Services */}
                    {categoryGroup.directBookableServices.map((service) => (
                      <Link
                        key={service._id}
                        href={`/book?service=${service._id}`}
                        className={styles.mobileDropdownItem}
                        onClick={() => {
                          setShowServicesDropdown(false);
                          setShowMobileMenu(false);
                        }}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.mobileDropdown} ref={mobileProductsDropdownRef}>
            {productsHierarchy.length > 0 ? (
              <button
                type="button"
                className={styles.mobileDropdownButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProductsDropdown(!showProductsDropdown);
                  setShowServicesDropdown(false);
                }}
              >
                Products <FaChevronDown className={showProductsDropdown ? styles.rotated : ""} />
              </button>
            ) : (
              <Link
                href="/#products"
                className={styles.mobileDropdownButton}
                onClick={() => setShowMobileMenu(false)}
              >
                Products
              </Link>
            )}
            {showProductsDropdown && productsHierarchy.length > 0 && (
              <div className={styles.mobileDropdownMenu}>
                {productsHierarchy.map((categoryGroup) => (
                  <div key={categoryGroup.category._id}>
                    <div className={styles.mobileDropdownSectionTitle}>
                      {categoryGroup.category.name}
                    </div>

                    {/* Parent Products (only those with buyable children) */}
                    {categoryGroup.parentProducts.map((parent) => (
                      <div key={parent._id}>
                        <div className={styles.mobileDropdownParentTitle}>
                          {parent.name}
                        </div>
                        {parent.children.map((child) => (
                          <Link
                            key={child._id}
                            href={`/#products`}
                            className={styles.mobileDropdownChildItem}
                            onClick={() => {
                              setShowProductsDropdown(false);
                              setShowMobileMenu(false);
                            }}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ))}

                    {/* Direct Buyable Products */}
                    {categoryGroup.directBuyableProducts.map((product) => (
                      <Link
                        key={product._id}
                        href={`/#products`}
                        className={styles.mobileDropdownItem}
                        onClick={() => {
                          setShowProductsDropdown(false);
                          setShowMobileMenu(false);
                        }}
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/about"
            className={`${styles.mobileNavLink} ${
              pathname === "/about" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            About
          </Link>

          <Link
            href="/contact"
            className={`${styles.mobileNavLink} ${
              pathname === "/contact" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            Contact
          </Link>

          <Link
            href="/career"
            className={`${styles.mobileNavLink} ${
              pathname === "/career" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            Careers
          </Link>

          <Link
            href="/partner-with-us"
            className={`${styles.mobileNavLink} ${
              pathname === "/partner-with-us" ? styles.active : ""
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            Partner With Us
          </Link>

          {bookingServiceIds.length > 0 && (
            <Link
              href={
                bookingServiceIds.length === 1
                  ? `/book?service=${bookingServiceIds[0]}`
                  : `/book?services=${bookingServiceIds.join(",")}`
              }
              className={styles.mobileNavLink}
              onClick={() => setShowMobileMenu(false)}
            >
              <FaCalendarCheck /> Book <span className={styles.bookingCount}>{bookingServiceIds.length}</span>
            </Link>
          )}

          {user ? (
            <button
              type="button"
              className={`${styles.mobileNavLink} ${styles.mobileUserLink}`}
              onClick={() => {
                setShowProfileSidebar(true);
                setShowMobileMenu(false);
              }}
            >
              <FaUser /> {user.name || user.phone}
            </button>
          ) : (
            <Link
              href="/user/login"
              className={`${styles.mobileNavLink} ${styles.mobileLoginLink}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}

      {/* Profile Sidebar */}
      {showProfileSidebar && (
        <div className={styles.profileOverlay} onClick={() => setShowProfileSidebar(false)}>
          <aside
            className={styles.profileSidebar}
            ref={profileSidebarRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Profile menu"
          >
            <div className={styles.profileSidebarHeader}>
              <div className={styles.profileSidebarTitle}>profile menu</div>
              <button
                type="button"
                className={styles.profileSidebarClose}
                onClick={() => setShowProfileSidebar(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.profileCard}>
              <div className={styles.profileAvatar}>
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
                  />
                ) : (
                  <FaUser />
                )}
              </div>
              <div className={styles.profileMeta}>
                <div className={styles.profileName}>{user?.name || "User"}</div>
                <div className={styles.profileSub}>{user?.phone ? `Mobile number: +91 ${user.phone}` : ""}</div>
                {user?.email && <div className={styles.profileSub}>Email: {user.email}</div>}
              </div>
            </div>

            <div className={styles.profileMenu}>
              {sidebarItems.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.key}
                    type="button"
                    className={styles.profileMenuItem}
                    onClick={() => {
                      setShowProfileSidebar(false);
                      router.push(it.href);
                    }}
                  >
                    <span className={styles.profileMenuIcon}><Icon /></span>
                    <span className={styles.profileMenuLabel}>{it.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                className={`${styles.profileMenuItem} ${styles.profileMenuLogout}`}
                onClick={handleLogout}
              >
                <span className={styles.profileMenuIcon}><FaSignOutAlt /></span>
                <span className={styles.profileMenuLabel}>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
