"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImages";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import styles from "./admin.module.css";

type ProductFormState = {
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stock: number;
  rating: number;
  badge: string;
};

type UploadResponse = {
  imagePath: string;
  imageUrl: string;
};

const blank: ProductFormState = {
  name: "",
  price: 0,
  image: "/products/placeholder.svg",
  description: "",
  category: "",
  stock: 0,
  rating: 4.5,
  badge: ""
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image file"));
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { auth, isHydrated } = useApp();
  const isAdmin = auth.user?.role === "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!isHydrated) return;

    if (!auth.user) {
      router.replace("/auth/login?redirect=/admin/products");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [auth.user, isAdmin, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || !isAdmin) return;

    async function load() {
      try {
        setLoading(true);
        setPageError("");
        const data = await apiFetch<Product[]>("/products");
        setProducts(data);
      } catch (error: any) {
        setPageError(error?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin, isHydrated]);

  function resetForm() {
    setForm(blank);
    setEditingId(null);
    setFormError("");
    setUploadError("");
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      category: product.category,
      stock: product.stock,
      rating: product.rating ?? 4.5,
      badge: product.badge ?? ""
    });
    setFormError("");
    setUploadError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function reloadProducts() {
    const data = await apiFetch<Product[]>("/products");
    setProducts(data);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!auth.token) {
      setUploadError("Admin token is missing");
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Image must be 5 MB or smaller");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      setUploadError("");

      const data = await readFileAsDataUrl(file);
      const response = await apiFetch<UploadResponse>("/uploads", {
        method: "POST",
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          data
        })
      });

      setForm((current) => ({
        ...current,
        image: response.imagePath
      }));
    } catch (error: any) {
      setUploadError(error?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setUploadError("");

    if (!auth.token) {
      setFormError("Admin token is missing");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Product name is required");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Description is required");
      return;
    }

    if (!form.category.trim()) {
      setFormError("Category is required");
      return;
    }

    if (!form.image.trim()) {
      setFormError("Image path is required");
      return;
    }

    if (Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      setFormError("Price must be a valid positive number");
      return;
    }

    if (Number(form.stock) < 0 || Number.isNaN(Number(form.stock))) {
      setFormError("Stock must be a valid positive number");
      return;
    }

    try {
      setSubmitting(true);

      await apiFetch(editingId ? `/products/${editingId}` : "/products", {
        method: editingId ? "PUT" : "POST",
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          image: form.image.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          badge: form.badge.trim()
        })
      });

      resetForm();
      await reloadProducts();
    } catch (error: any) {
      setFormError(error?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!auth.token) return;

    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    try {
      await apiFetch(`/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(auth.token)
      });

      if (editingId === id) {
        resetForm();
      }

      await reloadProducts();
    } catch (error: any) {
      setPageError(error?.message || "Failed to delete product");
    }
  }

  if (!isHydrated || !auth.user || !isAdmin) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.tabs}>
        <span className={`${styles.tab} ${styles.tabActive}`}>Products</span>
        <Link href="/orders" className={styles.tab}>
          Orders
        </Link>
        <Link href="/admin/content" className={styles.tab}>
          Content
        </Link>
      </div>

      <div className={styles.wrapper}>
        <form className={`card ${styles.form}`} onSubmit={submit}>
          <h1>{editingId ? "Edit product" : "Add product"}</h1>
          <p className={styles.helper}>
            Manage catalog items here. You can upload a product image or paste an image URL/path.
            Orders can be reviewed from the admin orders tab.
          </p>

          {formError ? <p style={{ color: "crimson", marginBottom: 0 }}>{formError}</p> : null}

          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />

          <input
            placeholder="Image path"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />

          <div className={styles.uploadBlock}>
            <label className={styles.uploadLabel}>
              <span>Upload image</span>
              <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={submitting || uploadingImage}
              />
            </label>

            <p className={styles.uploadHint}>
              {uploadingImage
                ? "Uploading image..."
                : "Choose an image file to upload it to the server."}
            </p>

            <div className={styles.previewCard}>
              <img
                src={resolveProductImage(form.image, form.name, form.category)}
                alt={form.name || "Product preview"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/products/placeholder.svg";
                }}
              />

              <div className={styles.previewCopy}>
                <strong>Preview</strong>
                <span>{form.image || "/products/placeholder.svg"}</span>
              </div>
            </div>

            {uploadError ? (
              <p style={{ color: "crimson", marginBottom: 0 }}>{uploadError}</p>
            ) : null}
          </div>

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />

          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="Rating"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
          />

          <input
            placeholder="Badge (optional)"
            value={form.badge}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={submitting || uploadingImage}>
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="btn secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.list}>
          {loading ? <p>Loading products...</p> : null}

          {pageError ? <p style={{ color: "crimson", marginBottom: 12 }}>{pageError}</p> : null}

          {!loading && !pageError && products.length === 0 ? <p>No products found.</p> : null}

          {!loading &&
            !pageError &&
            products.map((product) => (
              <div key={product.id} className={`card ${styles.item}`}>
                <img
                  src={resolveProductImage(product.image, product.name, product.category)}
                  alt={product.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/products/placeholder.svg";
                  }}
                />

                <div>
                  <h3>{product.name}</h3>
                  <p className="muted">{product.category}</p>
                  <strong>{formatPrice(product.price)}</strong>
                  <p className="muted">Stock: {product.stock}</p>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => startEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => remove(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
