"use client";

import Link from "next/link";
import { Product } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { resolveProductImage } from "@/lib/productImages";
import styles from "./ProductCard.module.css";

export function ProductCard({ product }: { product: Product }) {
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
        <div className={styles.price}>${product.price.toFixed(2)}</div>

        <Link href={`/products/${product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3>{product.name}</h3>
        </Link>

        <p className="muted">{product.category}</p>

        <div className={styles.actions}>
          <Link href={`/products/${product.id}`} className="btn secondary">
            View
          </Link>
          <button className="btn" type="button" onClick={() => addToCart(product)}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
