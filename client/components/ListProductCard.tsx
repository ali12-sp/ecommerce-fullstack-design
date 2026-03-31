"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { resolveProductImage } from "@/lib/productImages";
import styles from "./ListProductCard.module.css";

export function ListProductCard({ product }: { product: Product }) {
  const { addToCart } = useApp();

  return (
    <div className={`card ${styles.card}`}>
      <Link href={`/products/${product.id}`}>
        <img
          src={resolveProductImage(product.image, product.name, product.category)}
          alt={product.name}
          className={styles.image}
        />
      </Link>

      <div className={styles.body}>
        <Link href={`/products/${product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3>{product.name}</h3>
        </Link>

        <div className={styles.price}>${product.price.toFixed(2)}</div>
        <p className="muted">{product.description}</p>

        <div className={styles.meta}>
          <span>⭐ {product.rating || 4.7}</span>
          <span>Free shipping</span>
          <span>In stock: {product.stock}</span>
        </div>

        <div className={styles.actions}>
          <Link href={`/products/${product.id}`} className="btn secondary">
            View details
          </Link>
          <button className="btn" type="button" onClick={() => addToCart(product)}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
