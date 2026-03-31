"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { calculateOrderSummary, formatPrice } from "@/lib/pricing";
import { getProductImage } from "@/lib/productImages";
import type { Order, PaymentMethod, ShippingAddress } from "@/lib/types";
import styles from "./checkout.module.css";

const defaultAddress: ShippingAddress = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan"
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, auth, isHydrated, clearCart } = useApp();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(defaultAddress);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [couponCode, setCouponCode] = useState("SAVE10");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.user) return;

    setShippingAddress((current) => ({
      ...current,
      fullName: current.fullName || auth.user?.name || "",
      email: current.email || auth.user?.email || ""
    }));
  }, [auth.user]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const pricing = calculateOrderSummary(subtotal, couponCode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth.token) {
      setError("Please log in before placing an order.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const order = await apiFetch<Order>("/orders", {
        method: "POST",
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          })),
          shippingAddress,
          paymentMethod,
          couponCode,
          notes
        })
      });

      clearCart();
      router.replace(`/orders?created=${order.id}`);
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isHydrated) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        Checking your checkout session...
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <div className="card empty-state">
          <h3>Sign in to continue checkout</h3>
          <p>You need an account before we can create and track your order.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/login?redirect=/checkout" className="btn-primary">
              Login
            </Link>
            <Link href="/auth/signup?redirect=/checkout" className="btn-light">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <div className={`card ${styles.emptyState}`}>
          <h1>No items ready for checkout</h1>
          <p>Add products to your cart first, then come back to place the order.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/products" className="btn-primary">
              Browse products
            </Link>
            <Link href="/orders" className="btn-light">
              View my orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <Link href="/cart">Cart</Link>
          <span>{">"}</span>
          <span>Checkout</span>
        </div>

        <div className={styles.layout}>
          <form className={`card ${styles.panel}`} onSubmit={handleSubmit}>
            <h1 className={styles.title}>Checkout</h1>
            <p className={styles.subtitle}>
              Complete your shipping details and payment method. Orders are stored in the
              database and can be tracked from your account.
            </p>

            {error ? <p className={styles.error}>{error}</p> : null}

            <section className={styles.section}>
              <h2>Shipping information</h2>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        fullName: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        email: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        phone: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        country: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.fullWidth}>
                  <label htmlFor="addressLine1">Address line 1</label>
                  <input
                    id="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        addressLine1: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.fullWidth}>
                  <label htmlFor="addressLine2">Address line 2</label>
                  <input
                    id="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        addressLine2: e.target.value
                      }))
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        city: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="state">State / Province</label>
                  <input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        state: e.target.value
                      }))
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="postalCode">Postal code</label>
                  <input
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress((current) => ({
                        ...current,
                        postalCode: e.target.value
                      }))
                    }
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="couponCode">Coupon code</label>
                  <input
                    id="couponCode"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Payment method</h2>

              <div className={styles.paymentList}>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={() => setPaymentMethod("cash_on_delivery")}
                  />
                  <div>
                    <strong>Cash on delivery</strong>
                    <span>Pay when the order reaches your delivery address.</span>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <div>
                    <strong>Card payment</strong>
                    <span>Saved as the selected method for this order.</span>
                  </div>
                </label>

                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                  />
                  <div>
                    <strong>Bank transfer</strong>
                    <span>Useful for wholesale or manual payment follow-up.</span>
                  </div>
                </label>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Order notes</h2>

              <div className={styles.fullWidth}>
                <label htmlFor="notes">Notes for the seller</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add delivery instructions or other notes"
                />
              </div>
            </section>

            <div className={styles.actions}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Placing order..." : "Place order"}
              </button>
              <Link href="/cart" className="btn-light">
                Back to cart
              </Link>
            </div>
          </form>

          <aside className={`card ${styles.summary}`}>
            <h2>Order summary</h2>

            <div className={styles.items}>
              {cart.map((item) => (
                <div key={item.id} className={styles.item}>
                  <img src={getProductImage(item.name, item.category)} alt={item.name} />

                  <div>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemMeta}>
                      {item.category} | Qty {item.quantity}
                    </p>
                  </div>

                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>- {formatPrice(pricing.discount)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{pricing.shippingFee === 0 ? "Free" : formatPrice(pricing.shippingFee)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatPrice(pricing.tax)}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatPrice(pricing.total)}</span>
            </div>

            <div className={styles.divider} />

            <p className={styles.success}>
              Coupon code <strong>{pricing.normalizedCoupon || "SAVE10"}</strong> gives 10% off.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
