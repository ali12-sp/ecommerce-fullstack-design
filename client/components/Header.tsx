"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { isExternalSiteLink, resolveSiteLinkHref } from "@/lib/siteContent";
import type { SiteLink } from "@/lib/types";

type HeaderProps = {
  brandName?: string;
  localeLabel?: string;
  headerLinks?: SiteLink[];
};

const fallbackHeaderLinks: SiteLink[] = [
  { label: "Hot offers", type: "route", value: "/products?sort=rating_desc", openInNewTab: false },
  { label: "Blog", type: "blog_index", value: "", openInNewTab: false },
  { label: "Sell with us", type: "content", value: "sell-with-us", openInNewTab: false },
  { label: "Partnership", type: "content", value: "become-a-partner", openInNewTab: false },
  { label: "Help center", type: "content", value: "help-center", openInNewTab: false }
];

export function Header({
  brandName = "Brand",
  localeLabel = "English | USD",
  headerLinks = fallbackHeaderLinks
}: HeaderProps) {
  const router = useRouter();
  const { cartCount, auth, isHydrated, logout } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const profileHref = useMemo(() => {
    if (!auth.user) return "/auth/login";
    if (auth.user.role === "admin") return "/admin/products";
    return "/orders";
  }, [auth.user]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (category !== "all") params.set("category", category);

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const brandInitial = brandName.trim().charAt(0).toUpperCase() || "B";

  return (
    <header className="site-header">
      <div className="container header-top">
        <Link href="/" className="brand-logo">
          <span className="brand-badge">{brandInitial}</span>
          <span>{brandName}</span>
        </Link>

        <div className="header-search">
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All category</option>
            <option value="Smart watches">Smart watches</option>
            <option value="Laptops">Laptops</option>
            <option value="Cameras">Cameras</option>
            <option value="Headphones">Headphones</option>
            <option value="Smartphones">Smartphones</option>
            <option value="Clothes and wear">Clothes and wear</option>
            <option value="Bags">Bags</option>
            <option value="Home appliance">Home appliance</option>
          </select>

          <button type="button" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="header-icons">
          <Link href={profileHref} className="header-icon-link">
            <span className="header-icon-circle">U</span>
            <span>{auth.user ? auth.user.name.split(" ")[0] : "Account"}</span>
          </Link>

          <Link href="/products" className="header-icon-link">
            <span className="header-icon-circle">S</span>
            <span>Shop</span>
          </Link>

          <Link href="/orders" className="header-icon-link">
            <span className="header-icon-circle">O</span>
            <span>Orders</span>
          </Link>

          <Link href="/cart" className="header-icon-link">
            <span className="header-icon-circle">C</span>
            <span>My cart</span>
            {cartCount > 0 ? <b className="cart-mini-badge">{cartCount}</b> : null}
          </Link>

          {isHydrated && auth.user ? (
            <button type="button" className="header-icon-button" onClick={handleLogout}>
              <span className="header-icon-circle">X</span>
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="header-nav-wrap">
        <div className="container header-nav">
          <div className="header-nav-left">
            <Link href="/products" className="header-nav-strong">
              <span className="nav-burger">=</span>
              All category
            </Link>
            {headerLinks.map((link) => {
              const href = resolveSiteLinkHref(link);
              const key = `${link.label}-${link.type}-${link.value}`;

              if (isExternalSiteLink(link)) {
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="header-nav-item"
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <Link key={key} href={href} className="header-nav-item">
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="header-nav-right">
            <span className="header-nav-item">
              {localeLabel} <span className="nav-caret">v</span>
            </span>
            <span className="header-nav-item">
              Ship to PK <span className="nav-caret">v</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
