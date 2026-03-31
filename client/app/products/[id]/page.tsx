import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { getProductGallery, resolveProductImage } from "@/lib/productImages";
import AddToCartButton from "@/components/AddToCartButton";
import ProductDetailAdminPanel from "@/components/ProductDetailAdminPanel";

type ProductDetailsPageProps = {
  params: {
    id: string;
  };
};

function getRatingStars(rating = 4.5) {
  const rounded = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"*".repeat(rounded)}${"-".repeat(5 - rounded)}`;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  let product: Product | null = null;
  let related: Product[] = [];

  try {
    product = await apiFetch<Product>(`/products/${params.id}`);
    related = await apiFetch<Product[]>("/products");
  } catch {
    product = null;
    related = [];
  }

  if (!product) {
    notFound();
  }

  const gallery = getProductGallery(product.image, product.name, product.category);
  const relatedItems = related.filter((item) => item.id !== product.id).slice(0, 6);

  return (
    <div className="detail-page">
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <Link href="/products">Products</Link>
          <span>{">"}</span>
          <span>{product.category}</span>
          <span>{">"}</span>
          <span>{product.name}</span>
        </div>

        <section className="card detail-hero">
          <div className="detail-gallery">
            <div className="detail-main-image">
              <img src={gallery[0]} alt={product.name} />
            </div>

            <div className="detail-thumb-row">
              {gallery.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className={`detail-thumb ${index === 0 ? "active" : ""}`}
                >
                  <img src={item} alt={`Gallery image ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="detail-info">
            <div className="stock-line">
              <span className="stock-green">
                {product.stock > 0 ? "Available now" : "Currently out of stock"}
              </span>
            </div>

            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-meta-top">
              <span className="gold-stars">{getRatingStars(product.rating)}</span>
              <span className="rating-number">{product.rating?.toFixed(1) || "4.5"}</span>
              <span className="dot-sep">|</span>
              <span className="muted">32 reviews</span>
              <span className="dot-sep">|</span>
              <span className="muted">154 sold</span>
            </div>

            <div className="detail-price-band">
              <div className="detail-price-box active">
                <strong>{formatPrice(product.price)}</strong>
                <span>1 to 5 units</span>
              </div>
              <div className="detail-price-box">
                <strong>{formatPrice(product.price + 12)}</strong>
                <span>6 to 20 units</span>
              </div>
              <div className="detail-price-box">
                <strong>{formatPrice(product.price + 18)}</strong>
                <span>21 plus units</span>
              </div>
            </div>

            <div className="detail-spec-table">
              <div className="detail-spec-row">
                <span className="label">Price:</span>
                <span>{formatPrice(product.price)}</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Category:</span>
                <span>{product.category}</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Material:</span>
                <span>Durable mixed materials</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Design:</span>
                <span>Modern catalog-ready finish</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Customization:</span>
                <span>Private label packaging available</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Protection:</span>
                <span>Refund policy supported</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Warranty:</span>
                <span>2 years limited warranty</span>
              </div>
              <div className="detail-spec-row">
                <span className="label">Stock:</span>
                <span>{product.stock}</span>
              </div>
            </div>

            {product.stock > 0 ? (
              <AddToCartButton product={product} />
            ) : (
              <button type="button" className="btn-light seller-btn" disabled>
                Out of stock
              </button>
            )}

            <ProductDetailAdminPanel product={product} />
          </div>

          <aside className="detail-seller card">
            <div className="seller-top">
              <div className="seller-avatar">R</div>
              <div>
                <p className="seller-subtitle">Supplier</p>
                <h3>Guanjoi Trading LLC</h3>
              </div>
            </div>

            <div className="seller-meta">
              <div>Berlin, Germany</div>
              <div>Verified seller</div>
              <div>Worldwide shipping</div>
            </div>

            <a href="mailto:sales@brand.com" className="btn-primary seller-btn">
              Contact seller
            </a>
            <Link href="/checkout" className="btn-light seller-btn">
              Buy now
            </Link>

            <Link className="save-later-btn" href="/cart">
              View cart
            </Link>
          </aside>
        </section>

        <div className="detail-content-grid">
          <section className="card detail-main-content">
            <div className="detail-tabs">
              <span className="active">Description</span>
              <span>Reviews</span>
              <span>Shipping</span>
              <span>About seller</span>
            </div>

            <div className="detail-description-block">
              <p>
                {product.description} This product page now works with live inventory, checkout,
                and order tracking instead of staying a static catalog mockup.
              </p>

              <p>
                Orders placed from this storefront are stored in MongoDB, stock is updated during
                checkout, and customers can review their order status later from the orders page.
              </p>
            </div>

            <div className="detail-info-grid">
              <div className="info-grid-row">
                <span>Model</span>
                <span>#8786867</span>
              </div>
              <div className="info-grid-row">
                <span>Style</span>
                <span>Classic style</span>
              </div>
              <div className="info-grid-row">
                <span>Certificate</span>
                <span>ISO-898921212</span>
              </div>
              <div className="info-grid-row">
                <span>Size</span>
                <span>34mm x 450mm x 19mm</span>
              </div>
              <div className="info-grid-row">
                <span>Memory</span>
                <span>36GB RAM equivalent</span>
              </div>
            </div>

            <ul className="detail-feature-list">
              <li>Responsive product detail layout</li>
              <li>Cart-ready quantity controls</li>
              <li>Inventory-aware add to cart behavior</li>
              <li>Related product suggestions</li>
            </ul>
          </section>

          <aside className="card related-sidebar">
            <h3>You may like</h3>

            <div className="related-list">
              {relatedItems.map((item) => (
                <Link key={item.id} href={`/products/${item.id}`} className="related-item">
                  <div className="related-thumb">
                    <img
                      src={resolveProductImage(item.image, item.name, item.category)}
                      alt={item.name}
                    />
                  </div>
                  <div>
                    <p>{item.name}</p>
                    <span>{formatPrice(item.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <section className="card detail-recommend-section">
          <h2 className="section-title">Related products</h2>

          <div className="detail-recommend-grid">
            {(relatedItems.length > 0 ? relatedItems : related.slice(0, 6)).map((item) => (
              <Link key={item.id} href={`/products/${item.id}`} className="detail-recommend-card">
                <div className="detail-recommend-thumb">
                  <img
                    src={resolveProductImage(item.image, item.name, item.category)}
                    alt={item.name}
                  />
                </div>
                <p>{item.name}</p>
                <span>{formatPrice(item.price)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card discount-banner">
          <div>
            <h3>Use coupon code SAVE10 on checkout</h3>
            <p>Orders over $100 also qualify for free shipping.</p>
          </div>
          <Link href="/checkout" className="discount-btn">
            Checkout now
          </Link>
        </section>
      </div>
    </div>
  );
}
