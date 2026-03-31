"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Product } from "@/lib/types";

type AddToCartButtonProps = {
  product: Product;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useApp();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const maxQty = Math.max(1, Math.min(6, product.stock));

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <div className="detail-cart-box">
      <div className="detail-cart-row">
        <label htmlFor="detail-qty">Qty:</label>
        <select
          id="detail-qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        >
          {Array.from({ length: maxQty }, (_, index) => index + 1).map((itemQty) => (
            <option key={itemQty} value={itemQty}>
              {itemQty}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="btn-primary seller-btn" onClick={handleAddToCart}>
        Add to cart
      </button>

      {added ? <p className="detail-added-msg">Added to cart successfully.</p> : null}
    </div>
  );
}
