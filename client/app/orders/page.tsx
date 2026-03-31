"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { formatPrice } from "@/lib/pricing";
import { getProductImage } from "@/lib/productImages";
import type { Order, OrderStatus } from "@/lib/types";
import styles from "./orders.module.css";

const statuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

function getStatusClass(status: OrderStatus) {
  return styles[status] || styles.pending;
}

export default function OrdersPage() {
  const { auth, isHydrated } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");

  const isAdmin = auth.user?.role === "admin";

  useEffect(() => {
    setCreatedOrderId(new URLSearchParams(window.location.search).get("created") || "");
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!auth.token) {
      setLoading(false);
      return;
    }

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch<Order[]>("/orders", {
          headers: getAuthHeaders(auth.token)
        });
        setOrders(data);
      } catch (requestError: any) {
        setError(requestError?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [auth.token, isHydrated]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!auth.token) return;

    try {
      setUpdatingId(orderId);
      const updatedOrder = await apiFetch<Order>(`/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify({ status })
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (requestError: any) {
      setError(requestError?.message || "Failed to update order status");
    } finally {
      setUpdatingId("");
    }
  }

  const summaryText = useMemo(() => {
    if (!auth.user) return "";
    if (isAdmin) {
      return "Review all customer orders, track totals, and update fulfillment status.";
    }
    return "Your recent orders live here with saved totals, shipping details, and current status.";
  }, [auth.user, isAdmin]);

  if (!isHydrated) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        Loading orders...
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <div className={`card ${styles.emptyState}`}>
          <h2>Login to view your orders</h2>
          <p>We keep order history tied to your account so you can revisit it after checkout.</p>
          <div className={styles.actions}>
            <Link href="/auth/login?redirect=/orders" className="btn-primary">
              Login
            </Link>
            <Link href="/auth/signup?redirect=/orders" className="btn-light">
              Create account
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
          <span>{isAdmin ? "Order management" : "My orders"}</span>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{isAdmin ? "Admin orders" : "My orders"}</h1>
            <p className={styles.subtitle}>{summaryText}</p>
          </div>

          <div className={styles.actions}>
            <Link href="/products" className="btn-light">
              Browse products
            </Link>
            <Link href="/checkout" className="btn-primary">
              New checkout
            </Link>
          </div>
        </div>

        {createdOrderId ? (
          <div className={styles.banner}>
            Order placed successfully. Your new order has been saved and inventory was updated.
          </div>
        ) : null}

        {error ? <div className={styles.error}>{error}</div> : null}

        {isAdmin ? (
          <div className={styles.tabs}>
            <Link href="/admin/products" className={styles.tab}>
              Products
            </Link>
            <span className={`${styles.tab} ${styles.tabActive}`}>Orders</span>
            <Link href="/admin/content" className={styles.tab}>
              Content
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className={`card ${styles.emptyState}`}>
            <h2>Loading orders</h2>
            <p>We are pulling your latest order history now.</p>
          </div>
        ) : null}

        {!loading && orders.length === 0 ? (
          <div className={`card ${styles.emptyState}`}>
            <h2>No orders yet</h2>
            <p>Your first successful checkout will appear here.</p>
            <div className={styles.actions}>
              <Link href="/products" className="btn-primary">
                Start shopping
              </Link>
              <Link href="/cart" className="btn-light">
                Open cart
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && orders.length > 0 ? (
          <div className={styles.list}>
            {orders.map((order) => (
              <article key={order.id} className={`card ${styles.card}`}>
                <div className={styles.cardTop}>
                  <div>
                    <h2>{order.orderNumber}</h2>
                    <div className={styles.meta}>
                      <span>Placed {new Date(order.createdAt).toLocaleString()}</span>
                      <span>{order.itemCount} items</span>
                      <span>{order.customerEmail}</span>
                    </div>
                  </div>

                  <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detailBox}>
                    <span className={styles.detailLabel}>Customer</span>
                    <strong>{order.customerName}</strong>
                  </div>
                  <div className={styles.detailBox}>
                    <span className={styles.detailLabel}>Payment</span>
                    <strong>{order.paymentMethod.replaceAll("_", " ")}</strong>
                  </div>
                  <div className={styles.detailBox}>
                    <span className={styles.detailLabel}>Shipping</span>
                    <strong>
                      {order.shippingAddress.city}, {order.shippingAddress.country}
                    </strong>
                  </div>
                  <div className={styles.detailBox}>
                    <span className={styles.detailLabel}>Total</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                </div>

                <div className={styles.itemList}>
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`} className={styles.item}>
                      <img
                        src={getProductImage(item.name, item.category)}
                        alt={item.name}
                      />

                      <div>
                        <p className={styles.itemName}>{item.name}</p>
                        <p className={styles.itemMeta}>
                          {item.category} | Qty {item.quantity}
                        </p>
                      </div>

                      <strong>{formatPrice(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <p>
                    Subtotal {formatPrice(order.subtotal)} | Discount{" "}
                    {formatPrice(order.discount)} | Shipping{" "}
                    {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)} | Tax{" "}
                    {formatPrice(order.tax)}
                  </p>

                  {isAdmin ? (
                    <div className={styles.adminTools}>
                      <label htmlFor={`status-${order.id}`}>Update status</label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        disabled={updatingId === order.id}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p>
                      Ship to: {order.shippingAddress.addressLine1}, {order.shippingAddress.city}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
