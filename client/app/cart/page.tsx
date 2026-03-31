"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { calculateOrderSummary, formatPrice } from "@/lib/pricing";
import { getProductImage } from "@/lib/productImages";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart } = useApp();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const pricing = calculateOrderSummary(subtotal, "SAVE10");

  return (
    <div className="cart-page">
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <Link href="/products">Products</Link>
          <span>{">"}</span>
          <span>My cart</span>
        </div>

        <h1 className="cart-title">My cart ({cart.length})</h1>

        <div className="cart-layout">
          <section className="card cart-items-card">
            {cart.length > 0 ? (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item-row">
                      <div className="cart-item-left">
                        <Link href={`/products/${item.id}`} className="cart-item-image">
                          <img src={getProductImage(item.name, item.category)} alt={item.name} />
                        </Link>

                        <div className="cart-item-content">
                          <Link
                            href={`/products/${item.id}`}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            <h3>{item.name}</h3>
                          </Link>

                          <p>
                            Category: {item.category}
                            <br />
                            Stock remaining: {item.stock}
                          </p>

                          <div className="cart-item-actions">
                            <button
                              type="button"
                              className="cart-remove-btn"
                              onClick={() => removeFromCart(item.id)}
                            >
                              Remove
                            </button>
                            <Link href={`/products/${item.id}`} className="cart-save-btn">
                              View details
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="cart-item-right">
                        <strong>{formatPrice(item.price)}</strong>

                        <select
                          value={item.quantity}
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        >
                          {[1, 2, 3, 4, 5, 6].map((qty) => (
                            <option key={qty} value={qty}>
                              Qty: {qty}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-bottom-actions">
                  <Link href="/products" className="btn-primary">
                    Back to shop
                  </Link>
                  <button type="button" className="btn-light" onClick={clearCart}>
                    Remove all
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Your cart is empty</h3>
                <p>Add some products first.</p>
                <Link href="/products" className="btn-primary">
                  Go shopping
                </Link>
              </div>
            )}
          </section>

          <aside className="cart-sidebar">
            <div className="card coupon-card">
              <p>Coupon tip</p>
              <div className="coupon-row">
                <input type="text" value="SAVE10" readOnly />
                <Link href="/checkout">Use at checkout</Link>
              </div>
            </div>

            <div className="card summary-card">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row discount">
                <span>Discount:</span>
                <span>- {formatPrice(pricing.discount)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>{pricing.shippingFee === 0 ? "Free" : formatPrice(pricing.shippingFee)}</span>
              </div>
              <div className="summary-row tax">
                <span>Tax:</span>
                <span>+ {formatPrice(pricing.tax)}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Total:</span>
                <strong>{formatPrice(pricing.total)}</strong>
              </div>

              <Link href="/checkout" className="checkout-btn">
                Proceed to checkout
              </Link>

              <div className="payment-row">
                <span>COD</span>
                <span>VISA</span>
                <span>MC</span>
                <span>BANK</span>
              </div>
            </div>
          </aside>
        </div>

        <section className="cart-feature-row">
          <div className="cart-feature-item">
            <div className="cart-feature-icon">P</div>
            <div>
              <h4>Secure payment</h4>
              <p>Orders are stored after successful checkout.</p>
            </div>
          </div>

          <div className="cart-feature-item">
            <div className="cart-feature-icon">S</div>
            <div>
              <h4>Customer support</h4>
              <p>Use your account to review order status anytime.</p>
            </div>
          </div>

          <div className="cart-feature-item">
            <div className="cart-feature-icon">D</div>
            <div>
              <h4>Fast delivery</h4>
              <p>Free shipping is unlocked once your subtotal passes $100.</p>
            </div>
          </div>
        </section>

        <section className="card saved-section">
          <div className="saved-header">
            <h2 className="section-title">Need more items?</h2>
          </div>

          <div className="saved-grid">
            {[
              "/products/watch.jpg",
              "/products/headphone.jpg",
              "/products/laptop.jpg",
              "/products/camera-canon.jpg"
            ].map((image, index) => (
              <Link key={image} href="/products" className="saved-card">
                <div className="saved-thumb">
                  <img src={image} alt={`Suggested product ${index + 1}`} />
                </div>
                <strong>$99.50</strong>
                <p>Browse more catalog items and build a larger checkout.</p>
                <span className="saved-move-btn">Explore products</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card discount-banner">
          <div>
            <h3>Save 10 percent with code SAVE10</h3>
            <p>Checkout now to turn your cart into a tracked order.</p>
          </div>
          <Link href="/checkout" className="discount-btn">
            Checkout
          </Link>
        </section>
      </div>
    </div>
  );
}
