import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { resolveProductImage } from "@/lib/productImages";

type ProductsPageProps = {
  searchParams?: {
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
  };
};

const sidebarCategories = [
  "All category",
  "Smart watches",
  "Laptops",
  "Cameras",
  "Headphones",
  "Smartphones",
  "Clothes and wear",
  "Bags",
  "Home appliance"
];

function getRatingStars(rating = 4.5) {
  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"*".repeat(rounded)}${"-".repeat(5 - rounded)}`;
}

function normalizeCategory(value: string) {
  if (!value || value === "All category") return "";
  return value.toLowerCase();
}

function filterProducts(
  products: Product[],
  search?: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  minRating?: number
) {
  let filtered = [...products];

  if (search?.trim()) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  if (category?.trim()) {
    const normalizedCategory = normalizeCategory(category);
    if (normalizedCategory) {
      filtered = filtered.filter(
        (item) => item.category.toLowerCase() === normalizedCategory
      );
    }
  }

  if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
    filtered = filtered.filter((item) => item.price >= minPrice);
  }

  if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) {
    filtered = filtered.filter((item) => item.price <= maxPrice);
  }

  if (typeof minRating === "number" && !Number.isNaN(minRating)) {
    filtered = filtered.filter((item) => (item.rating ?? 0) >= minRating);
  }

  return filtered;
}

function sortProducts(products: Product[], sort?: string) {
  const items = [...products];

  switch (sort) {
    case "price_asc":
      return items.sort((a, b) => a.price - b.price);
    case "price_desc":
      return items.sort((a, b) => b.price - a.price);
    case "name_asc":
      return items.sort((a, b) => a.name.localeCompare(b.name));
    case "rating_desc":
      return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return items;
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const currentSearch = searchParams?.search || "";
  const currentCategory = searchParams?.category || "";
  const currentSort = searchParams?.sort || "";
  const currentPage = Number(searchParams?.page || "1");
  const currentMinPrice = searchParams?.minPrice || "";
  const currentMaxPrice = searchParams?.maxPrice || "";
  const currentMinRating = searchParams?.minRating || "";

  let products: Product[] = [];

  try {
    products = await apiFetch<Product[]>("/products");
  } catch {
    products = [];
  }

  const filtered = sortProducts(
    filterProducts(
      products,
      currentSearch,
      currentCategory,
      currentMinPrice ? Number(currentMinPrice) : undefined,
      currentMaxPrice ? Number(currentMaxPrice) : undefined,
      currentMinRating ? Number(currentMinRating) : undefined
    ),
    currentSort
  );

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div className="listing-page">
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <span>Products</span>
          {currentCategory ? (
            <>
              <span>{">"}</span>
              <span>{currentCategory}</span>
            </>
          ) : null}
        </div>

        <div className="listing-layout">
          <aside className="listing-sidebar">
            <div className="card filter-card">
              <div className="filter-block">
                <div className="filter-title">Category</div>
                <div className="filter-links">
                  {sidebarCategories.map((item) => {
                    const isActive =
                      (item === "All category" && !currentCategory) || currentCategory === item;

                    return (
                      <Link
                        key={item}
                        href={buildQuery({
                          search: currentSearch || undefined,
                          category: item === "All category" ? undefined : item,
                          sort: currentSort || undefined,
                          minPrice: currentMinPrice || undefined,
                          maxPrice: currentMaxPrice || undefined,
                          minRating: currentMinRating || undefined
                        })}
                        className={isActive ? "active" : ""}
                      >
                        {item}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <form action="/products" method="get" className="filter-block">
                <div className="filter-title">Price range</div>
                {currentSearch ? <input type="hidden" name="search" value={currentSearch} /> : null}
                {currentCategory ? (
                  <input type="hidden" name="category" value={currentCategory} />
                ) : null}
                {currentSort ? <input type="hidden" name="sort" value={currentSort} /> : null}
                {currentMinRating ? (
                  <input type="hidden" name="minRating" value={currentMinRating} />
                ) : null}

                <div className="range-boxes">
                  <input type="text" name="minPrice" placeholder="Min" defaultValue={currentMinPrice} />
                  <input type="text" name="maxPrice" placeholder="Max" defaultValue={currentMaxPrice} />
                </div>
                <button type="submit" className="btn-light apply-btn">
                  Apply
                </button>
              </form>

              <div className="filter-block">
                <div className="filter-title">Minimum rating</div>
                <div className="filter-links">
                  {["4", "4.5", "5"].map((rating) => (
                    <Link
                      key={rating}
                      href={buildQuery({
                        search: currentSearch || undefined,
                        category: currentCategory || undefined,
                        sort: currentSort || undefined,
                        minPrice: currentMinPrice || undefined,
                        maxPrice: currentMaxPrice || undefined,
                        minRating: rating
                      })}
                      className={currentMinRating === rating ? "active" : ""}
                    >
                      {rating}+ stars
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="listing-content">
            <div className="card results-toolbar">
              <div className="results-left">
                <strong>{filtered.length}</strong> items
                {currentCategory ? (
                  <>
                    {" "}in <strong>{currentCategory}</strong>
                  </>
                ) : null}
              </div>

              <div className="results-right">
                <form action="/products" method="get" className="sort-form">
                  {currentSearch ? <input type="hidden" name="search" value={currentSearch} /> : null}
                  {currentCategory ? (
                    <input type="hidden" name="category" value={currentCategory} />
                  ) : null}
                  {currentMinPrice ? (
                    <input type="hidden" name="minPrice" value={currentMinPrice} />
                  ) : null}
                  {currentMaxPrice ? (
                    <input type="hidden" name="maxPrice" value={currentMaxPrice} />
                  ) : null}
                  {currentMinRating ? (
                    <input type="hidden" name="minRating" value={currentMinRating} />
                  ) : null}

                  <select className="sort-select" name="sort" defaultValue={currentSort}>
                    <option value="">Featured</option>
                    <option value="price_asc">Price: Low to high</option>
                    <option value="price_desc">Price: High to low</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="rating_desc">Rating: High to low</option>
                  </select>

                  <button type="submit" className="btn-light sort-apply-btn">
                    Apply
                  </button>
                </form>
              </div>
            </div>

            <div className="active-filters">
              {currentCategory ? (
                <Link
                  href={buildQuery({
                    search: currentSearch || undefined,
                    sort: currentSort || undefined,
                    minPrice: currentMinPrice || undefined,
                    maxPrice: currentMaxPrice || undefined,
                    minRating: currentMinRating || undefined
                  })}
                  className="filter-chip"
                >
                  {currentCategory} x
                </Link>
              ) : null}

              {currentSearch ? (
                <Link
                  href={buildQuery({
                    category: currentCategory || undefined,
                    sort: currentSort || undefined,
                    minPrice: currentMinPrice || undefined,
                    maxPrice: currentMaxPrice || undefined,
                    minRating: currentMinRating || undefined
                  })}
                  className="filter-chip"
                >
                  {currentSearch} x
                </Link>
              ) : null}

              {(currentMinPrice || currentMaxPrice) ? (
                <Link
                  href={buildQuery({
                    search: currentSearch || undefined,
                    category: currentCategory || undefined,
                    sort: currentSort || undefined,
                    minRating: currentMinRating || undefined
                  })}
                  className="filter-chip"
                >
                  Price {currentMinPrice || "0"} to {currentMaxPrice || "any"} x
                </Link>
              ) : null}

              {currentMinRating ? (
                <Link
                  href={buildQuery({
                    search: currentSearch || undefined,
                    category: currentCategory || undefined,
                    sort: currentSort || undefined,
                    minPrice: currentMinPrice || undefined,
                    maxPrice: currentMaxPrice || undefined
                  })}
                  className="filter-chip"
                >
                  {currentMinRating}+ stars x
                </Link>
              ) : null}

              {(currentCategory ||
                currentSearch ||
                currentMinPrice ||
                currentMaxPrice ||
                currentMinRating) && (
                <Link href="/products" className="clear-filters-link">
                  Clear all filters
                </Link>
              )}
            </div>

            <div className="listing-cards">
              {paginated.length > 0 ? (
                paginated.map((product) => (
                  <div key={product.id} className="card list-product-card">
                    <Link href={`/products/${product.id}`} className="list-product-image">
                      <img
                        src={resolveProductImage(product.image, product.name, product.category)}
                        alt={product.name}
                      />
                    </Link>

                    <div className="list-product-body">
                      <div className="list-top">
                        <Link href={`/products/${product.id}`} className="list-product-title">
                          {product.name}
                        </Link>
                        <Link href={`/products/${product.id}`} className="wish-btn">
                          +
                        </Link>
                      </div>

                      <div className="list-product-price-row">
                        <span className="current-price">{formatPrice(product.price)}</span>
                        <span className="old-price">
                          {formatPrice(product.price + product.price * 0.25)}
                        </span>
                      </div>

                      <div className="list-meta-row">
                        <span className="gold-stars">{getRatingStars(product.rating)}</span>
                        <span className="rating-number">{product.rating?.toFixed(1) || "4.5"}</span>
                        <span className="dot-sep">|</span>
                        <span className="muted">{product.category}</span>
                        <span className="dot-sep">|</span>
                        <span className="stock-green">
                          {product.stock > 0 ? "In stock" : "Out of stock"}
                        </span>
                      </div>

                      <p className="list-description">{product.description}</p>

                      <Link href={`/products/${product.id}`} className="details-link">
                        View details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card" style={{ padding: 24 }}>
                  No products found.
                </div>
              )}
            </div>

            <div className="listing-bottom-bar">
              <span className="muted">
                Page {safePage} of {totalPages}
              </span>

              <div className="pagination-box">
                <Link
                  href={buildQuery({
                    search: currentSearch || undefined,
                    category: currentCategory || undefined,
                    sort: currentSort || undefined,
                    minPrice: currentMinPrice || undefined,
                    maxPrice: currentMaxPrice || undefined,
                    minRating: currentMinRating || undefined,
                    page: String(Math.max(1, safePage - 1))
                  })}
                  className={`page-arrow ${safePage === 1 ? "disabled" : ""}`}
                >
                  {"<"}
                </Link>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <Link
                      key={page}
                      href={buildQuery({
                        search: currentSearch || undefined,
                        category: currentCategory || undefined,
                        sort: currentSort || undefined,
                        minPrice: currentMinPrice || undefined,
                        maxPrice: currentMaxPrice || undefined,
                        minRating: currentMinRating || undefined,
                        page: String(page)
                      })}
                      className={`page-number ${page === safePage ? "active" : ""}`}
                    >
                      {page}
                    </Link>
                  );
                })}

                <Link
                  href={buildQuery({
                    search: currentSearch || undefined,
                    category: currentCategory || undefined,
                    sort: currentSort || undefined,
                    minPrice: currentMinPrice || undefined,
                    maxPrice: currentMaxPrice || undefined,
                    minRating: currentMinRating || undefined,
                    page: String(Math.min(totalPages, safePage + 1))
                  })}
                  className={`page-arrow ${safePage === totalPages ? "disabled" : ""}`}
                >
                  {">"}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
