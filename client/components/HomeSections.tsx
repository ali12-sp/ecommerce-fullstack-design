import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { Product } from "@/lib/types";
import { resolveProductImage } from "@/lib/productImages";
import styles from "./HomeSections.module.css";

export function HomeSections({ products }: { products: Product[] }) {
  return (
    <>
      <section className={`container ${styles.heroWrap}`}>
        <div className={`card ${styles.sidebar}`}>
          {["Automobiles", "Clothes and wear", "Home interiors", "Computer and tech", "Tools", "Sports", "Animal and pets"].map((item) => (
            <div key={item} className={styles.sideLink}>{item}</div>
          ))}
        </div>
        <div className={`card ${styles.hero}`}>
          <div>
            <p className="muted">Latest trending</p>
            <h1>Electronic items</h1>
            <Link href="/products" className="btn secondary">Learn more</Link>
          </div>
        </div>
        <div className={styles.promos}>
          <div className={`card ${styles.promoBox}`}>
            <strong>Hi, user</strong>
            <p className="muted">let&apos;s get started</p>
            <Link href="/auth/signup" className="btn">Join now</Link>
          </div>
          <div className={`card ${styles.orange}`}>Get US $10 off with a new supplier</div>
          <div className={`card ${styles.teal}`}>Send quotes with supplier preferences</div>
        </div>
      </section>

      <section className={`container ${styles.dealRow}`}>
        <div className={`card ${styles.dealIntro}`}>
          <h3>Deals and offers</h3>
          <p className="muted">Hygiene equipments</p>
        </div>
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className={`card ${styles.dealCard}`}>
            <img
              src={resolveProductImage(product.image, product.name, product.category)}
              alt={product.name}
            />
            <strong>{product.name}</strong>
            <span>-25%</span>
          </div>
        ))}
      </section>

      <section className="container" style={{ marginTop: 24 }}>
        <h2 className="section-title">Recommended items</h2>
        <div className="grid-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
