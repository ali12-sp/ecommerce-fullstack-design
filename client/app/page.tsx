import Link from "next/link";
import type { CSSProperties } from "react";
import { apiFetch } from "@/lib/api";
import { HeroSlider } from "@/components/HeroSlider";
import { resolveProductImage } from "@/lib/productImages";
import { formatPrice } from "@/lib/pricing";
import type { HeroSlide, Product, SiteSettings } from "@/lib/types";
import styles from "./home.module.css";

type CategoryGroup = {
  name: string;
  products: Product[];
  count: number;
  avgPrice: number;
  avgRating: number;
};

const supplierRegions = [
  { code: "AE", name: "United Arab Emirates", site: "shop.ae" },
  { code: "AU", name: "Australia", site: "shop.au" },
  { code: "US", name: "United States", site: "shop.us" },
  { code: "RU", name: "Russia", site: "shop.ru" },
  { code: "IT", name: "Italy", site: "shop.it" },
  { code: "DK", name: "Denmark", site: "shop.dk" },
  { code: "FR", name: "France", site: "shop.fr" },
  { code: "CN", name: "China", site: "shop.cn" },
  { code: "GB", name: "Great Britain", site: "shop.uk" },
  { code: "PK", name: "Pakistan", site: "shop.pk" }
];

const showcaseLabels = ["Home and outdoor", "Consumer electronics"];

function normalizeCategoryKey(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function buildProductsHref(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/products?${query}` : "/products";
}

function buildCategoryGroups(products: Product[]) {
  const grouped = products.reduce<Map<string, Product[]>>((map, product) => {
    const category = product.category?.trim() || "Other";
    const current = map.get(category) || [];
    current.push(product);
    map.set(category, current);
    return map;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([name, items]) => ({
      name,
      products: items.sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.stock - a.stock
      ),
      count: items.length,
      avgPrice: items.reduce((sum, item) => sum + item.price, 0) / items.length,
      avgRating:
        items.reduce((sum, item) => sum + (item.rating ?? 0), 0) / items.length
    }))
    .sort((a, b) => b.count - a.count || b.avgRating - a.avgRating);
}

export default async function HomePage() {
  let products: Product[] = [];
  let siteSettings: SiteSettings | null = null;

  try {
    products = await apiFetch<Product[]>("/products");
  } catch {
    products = [];
  }

  try {
    siteSettings = await apiFetch<SiteSettings>("/site-settings");
  } catch {
    siteSettings = null;
  }

  const categoryGroups = buildCategoryGroups(products);
  const featuredCategories = categoryGroups.slice(0, 8);
  const featuredProducts = [...products]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.stock - a.stock)
    .slice(0, 10);
  const heroProducts = featuredProducts.slice(0, 3);
  const heroSlides: HeroSlide[] =
    siteSettings?.heroSlides?.filter((slide) => slide.image && slide.title) ||
    [];
  const categoryHighlightMap = new Map(
    (siteSettings?.categoryHighlights || [])
      .filter((highlight) => highlight.category && highlight.image)
      .map((highlight) => [normalizeCategoryKey(highlight.category), highlight.image])
  );
  const serviceTileImages = siteSettings?.serviceTileImages || [];
  const quoteSectionImage = siteSettings?.quoteSectionImage?.trim() || "";
  const dealProducts = [...products]
    .sort((a, b) => b.stock - a.stock || a.price - b.price)
    .slice(0, 5);
  const showcaseGroups = categoryGroups.slice(0, 2).map((group) => ({
    ...group,
    products: group.products.slice(0, 8)
  }));
  const quickSearches = Array.from(
    new Set([
      ...featuredProducts.map((product) => product.name),
      ...featuredCategories.map((category) => category.name)
    ])
  ).slice(0, 6);

  const serviceCards = [
    {
      title: "Source from Industry Hubs",
      copy: "Use live categories and product detail pages to compare inventory faster.",
      image: serviceTileImages[0] || featuredProducts[0]?.image
    },
    {
      title: "Customize Supplier Requests",
      copy: "Search the catalog by keyword, category, and price without changing backend logic.",
      image: serviceTileImages[1] || featuredProducts[1]?.image
    },
    {
      title: "Fast, Verified Shipping",
      copy: "Move from storefront browsing into checkout and order tracking in one flow.",
      image: serviceTileImages[2] || featuredProducts[2]?.image
    },
    {
      title: "Product Monitoring and Inspecting",
      copy: "Your homepage cards stay connected to stock, ratings, and real product updates.",
      image: serviceTileImages[3] || featuredProducts[3]?.image
    }
  ];
  const quoteSectionStyle = quoteSectionImage
    ? ({
        "--quote-section-image": `url("${resolveProductImage(
          quoteSectionImage,
          "Quote section"
        )}")`
      } as CSSProperties)
    : undefined;

  return (
    <div className={styles.page}>
      <div className="container">
        <section className={`card ${styles.heroShell}`}>
          <aside className={styles.categoryRail}>
            <div className={styles.railHeader}>
              <span className={styles.kicker}>Categories</span>
            </div>

            <div className={styles.categoryLinks}>
              {featuredCategories.length > 0 ? (
                featuredCategories.map((category, index) => (
                  <Link
                    key={category.name}
                    href={buildProductsHref({ category: category.name })}
                    className={index === 0 ? styles.categoryLinkActive : styles.categoryLink}
                  >
                    <span>{category.name}</span>
                    <small>{category.count} items</small>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyState}>
                  Add products to show live categories here.
                </div>
              )}
            </div>
          </aside>

          <div className={styles.heroMain}>
            {heroSlides.length > 0 || heroProducts.length > 0 ? (
              <HeroSlider
                slides={
                  heroSlides.length > 0
                    ? heroSlides
                    : heroProducts.map((product) => ({
                        id: product.id,
                        eyebrow: "Latest trending",
                        title: product.name,
                        description: product.description,
                        image: product.image,
                        ctaLabel: "Learn more",
                        ctaHref: `/products/${product.id}`
                      }))
                }
              />
            ) : (
              <div className={`card ${styles.emptyState}`}>
                Add a few products or hero slides to populate the main banner.
              </div>
            )}
          </div>

          <aside className={styles.sideColumn}>
            <div className={`${styles.sideCard} ${styles.accountCard}`}>
              <div className={styles.accountTop}>
                <div className={styles.accountAvatar}>B</div>
                <div>
                  <strong>Hi, user</strong>
                  <p>Let&apos;s get started with live product search and sourcing.</p>
                </div>
              </div>

              <div className={styles.accountActions}>
                <Link href="/auth/signup" className="btn-primary">
                  Join now
                </Link>
                <Link href="/auth/login" className="btn-light">
                  Log in
                </Link>
              </div>
            </div>

            <Link
              href={buildProductsHref({ sort: "rating_desc" })}
              className={`${styles.sideCard} ${styles.orangeCard}`}
            >
              <strong>Get US $10 off with a new supplier</strong>
              <p>Browse best-rated products first using the same live catalog data.</p>
            </Link>

            <Link href="/products" className={`${styles.sideCard} ${styles.blueCard}`}>
              <strong>Send quotes with supplier preferences</strong>
              <p>Search products and jump directly into the buying flow without extra steps.</p>
            </Link>
          </aside>
        </section>

        <section className={`card ${styles.dealsRow}`}>
          <div className={styles.dealsIntro}>
            <h2>Deals and offers</h2>
            <p>{dealProducts[0]?.category || "Live catalog offers"}</p>
            <div className={styles.dealStats}>
              <div>
                <strong>{dealProducts.length}</strong>
                <span>Top picks</span>
              </div>
              <div>
                <strong>{products.filter((product) => product.stock > 0).length}</strong>
                <span>In stock</span>
              </div>
              <div>
                <strong>{featuredCategories.length}</strong>
                <span>Sections</span>
              </div>
            </div>
          </div>

          <div className={styles.dealItems}>
            {dealProducts.length > 0 ? (
              dealProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={styles.dealItem}
                >
                  <div className={styles.dealImage}>
                    <img
                      src={resolveProductImage(product.image, product.name, product.category)}
                      alt={product.name}
                    />
                  </div>
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                  <small>Ready stock: {product.stock}</small>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>
                Add products to populate the deals row.
              </div>
            )}
          </div>
        </section>

        {showcaseGroups.length > 0 ? (
          showcaseGroups.map((group, index) => {
            const bannerImage =
              categoryHighlightMap.get(normalizeCategoryKey(group.name)) ||
              group.products[0]?.image;
            const bannerImageSrc = resolveProductImage(
              bannerImage,
              group.name,
              group.name
            );

            return (
              <section key={group.name} className={`card ${styles.categoryBlock}`}>
                <div
                  className={`${styles.categoryBanner} ${
                    index % 2 === 1 ? styles.categoryBannerAlt : ""
                  }`}
                >
                  <img
                    className={styles.categoryBannerMedia}
                    src={bannerImageSrc}
                    alt={group.name}
                  />
                  <div className={styles.categoryBannerCopy}>
                    <span className={styles.kicker}>
                      {showcaseLabels[index] || "Category spotlight"}
                    </span>
                    <h2>{group.name}</h2>
                    <p>
                      {group.count} live listings with an average price of{" "}
                      {formatPrice(group.avgPrice)}.
                    </p>
                    <Link
                      href={buildProductsHref({ category: group.name })}
                      className="btn-light"
                    >
                      Source now
                    </Link>
                  </div>
                </div>

                <div className={styles.categoryTiles}>
                  {group.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className={styles.categoryTile}
                    >
                      <div className={styles.categoryTileBody}>
                        <strong>{product.name}</strong>
                        <span>From {formatPrice(product.price)}</span>
                      </div>
                      <div className={styles.categoryTileImage}>
                        <img
                          src={resolveProductImage(product.image, product.name, product.category)}
                          alt={product.name}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className={`card ${styles.emptyState}`}>
            Add products to generate the category showcase sections.
          </div>
        )}

        <section className={styles.quoteSection} style={quoteSectionStyle}>
          <div className={styles.quoteCopy}>
            <span className={styles.kicker}>Request a quote</span>
            <h2>An easy way to send requests to all suppliers</h2>
            <p>
              Keep using the same live catalog, product pages, and backend data while presenting
              the homepage in a more marketplace-style layout.
            </p>
          </div>

          <form action="/products" method="get" className={`card ${styles.quoteForm}`}>
            <h3>Send quote to suppliers</h3>
            <input type="text" name="search" placeholder="What item are you looking for?" />
            <textarea name="description" placeholder="Add product details or requirements" />
            <div className={styles.quoteRow}>
              <select name="category" defaultValue="">
                <option value="">Select category</option>
                {featuredCategories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" name="maxPrice" placeholder="Max price" />
            </div>
            <button type="submit" className="btn-primary">
              Send inquiry
            </button>
          </form>
        </section>

        <section className={styles.recommendedSection}>
          <div className={styles.sectionHead}>
            <h2>Recommended items</h2>
            <Link href="/products">View all</Link>
          </div>

          <div className={styles.recommendedGrid}>
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={`card ${styles.recommendedCard}`}
                >
                  <div className={styles.recommendedImage}>
                    <img
                      src={resolveProductImage(product.image, product.name, product.category)}
                      alt={product.name}
                    />
                  </div>
                  <div className={styles.recommendedBody}>
                    <strong>{formatPrice(product.price)}</strong>
                    <p>{product.name}</p>
                    <span>{product.category}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={`card ${styles.emptyState}`}>
                Add products in the admin panel to power the homepage cards.
              </div>
            )}
          </div>
        </section>

        <section className={styles.servicesSection}>
          <div className={styles.sectionHead}>
            <h2>Our extra services</h2>
          </div>

          <div className={styles.servicesGrid}>
            {serviceCards.map((service, index) => (
              <article key={service.title} className={`card ${styles.serviceCard}`}>
                <div
                  className={`${styles.serviceVisual} ${
                    index === 1
                      ? styles.serviceVisualBlue
                      : index === 2
                        ? styles.serviceVisualTeal
                        : index === 3
                          ? styles.serviceVisualGold
                          : ""
                  }`}
                  style={
                    {
                      "--service-card-image": `url("${resolveProductImage(
                        service.image,
                        service.title
                      )}")`
                    } as CSSProperties
                  }
                />
                <div className={styles.serviceContent}>
                  <h3>{service.title}</h3>
                  <p>{service.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.regionSection}>
          <div className={styles.sectionHead}>
            <h2>Suppliers by region</h2>
          </div>

          <div className={styles.regionGrid}>
            {supplierRegions.map((region) => (
              <div key={region.code} className={styles.regionItem}>
                <div className={styles.regionCode}>{region.code}</div>
                <div>
                  <strong>{region.name}</strong>
                  <span>{region.site}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.newsletter}>
          <h3>Subscribe on our newsletter</h3>
          <p>
            Get daily updates on catalog changes, featured products, and popular searches.
          </p>
          <form action="/products" method="get" className={styles.newsletterForm}>
            <input
              type="text"
              name="search"
              placeholder={quickSearches[0] || "Search the catalog"}
            />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
