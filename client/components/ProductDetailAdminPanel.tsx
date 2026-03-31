"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImages";
import type { Product } from "@/lib/types";
import styles from "./ProductDetailAdminPanel.module.css";

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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function createFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    price: product.price,
    image: product.image,
    description: product.description,
    category: product.category,
    stock: product.stock,
    rating: product.rating ?? 4.5,
    badge: product.badge ?? ""
  };
}

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

export default function ProductDetailAdminPanel({ product }: { product: Product }) {
  const router = useRouter();
  const { auth, isHydrated } = useApp();
  const isAdmin = auth.user?.role === "admin";

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProductFormState>(() => createFormState(product));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setForm(createFormState(product));
    }
  }, [isEditing, product]);

  if (!isHydrated || !isAdmin) {
    return null;
  }

  function resetEditor() {
    setIsEditing(false);
    setForm(createFormState(product));
    setFormError("");
    setUploadError("");
  }

  function toggleEditor() {
    setStatusMessage("");

    if (isEditing) {
      resetEditor();
      return;
    }

    setForm(createFormState(product));
    setFormError("");
    setUploadError("");
    setIsEditing(true);
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
      setStatusMessage("");

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
    setStatusMessage("");

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
      setSaving(true);

      await apiFetch(`/products/${product.id}`, {
        method: "PUT",
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

      setStatusMessage("Product updated successfully.");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      setFormError(error?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct() {
    if (!auth.token || deleting) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setFormError("");
      setUploadError("");
      setStatusMessage("");

      await apiFetch(`/products/${product.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(auth.token)
      });

      router.replace("/products");
    } catch (error: any) {
      setFormError(error?.message || "Failed to delete product");
      setDeleting(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin actions</p>
          <h2 className={styles.title}>Manage this product from here</h2>
          <p className={styles.copy}>
            Update the image or any product details, or remove the product completely.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn secondary"
            onClick={toggleEditor}
            disabled={saving || deleting || uploadingImage}
          >
            {isEditing ? "Cancel edit" : "Edit product"}
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={removeProduct}
            disabled={saving || deleting || uploadingImage}
          >
            {deleting ? "Deleting..." : "Delete product"}
          </button>
        </div>
      </div>

      {statusMessage ? <p className={styles.status}>{statusMessage}</p> : null}
      {formError ? <p className={styles.error}>{formError}</p> : null}
      {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

      {isEditing ? (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor="detail-admin-name">Name</label>
              <input
                id="detail-admin-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="detail-admin-category">Category</label>
              <input
                id="detail-admin-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="detail-admin-price">Price</label>
              <input
                id="detail-admin-price"
                type="number"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: Number(event.target.value) })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="detail-admin-stock">Stock</label>
              <input
                id="detail-admin-stock"
                type="number"
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: Number(event.target.value) })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="detail-admin-rating">Rating</label>
              <input
                id="detail-admin-rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(event) =>
                  setForm({ ...form, rating: Number(event.target.value) })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="detail-admin-badge">Badge</label>
              <input
                id="detail-admin-badge"
                value={form.badge}
                onChange={(event) => setForm({ ...form, badge: event.target.value })}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="detail-admin-image">Image path</label>
              <input
                id="detail-admin-image"
                value={form.image}
                onChange={(event) => setForm({ ...form, image: event.target.value })}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="detail-admin-description">Description</label>
              <textarea
                id="detail-admin-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.uploadBlock}>
            <label className={styles.uploadLabel}>
              <span>{uploadingImage ? "Uploading image..." : "Upload a new image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={saving || deleting || uploadingImage}
              />
            </label>

            <p className={styles.uploadHint}>
              Pick an image file to replace the current product image on the server.
            </p>

            <div className={styles.preview}>
              <div className={styles.previewImage}>
                <img
                  src={resolveProductImage(form.image, form.name, form.category)}
                  alt={form.name || "Product preview"}
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src =
                      "/products/placeholder.svg";
                  }}
                />
              </div>

              <div className={styles.previewCopy}>
                <strong>Current preview</strong>
                <span>{form.image || "/products/placeholder.svg"}</span>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className="btn"
              disabled={saving || deleting || uploadingImage}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              className="btn secondary"
              onClick={resetEditor}
              disabled={saving || deleting || uploadingImage}
            >
              Reset
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
