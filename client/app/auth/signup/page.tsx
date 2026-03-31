"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { AuthResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await apiFetch<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        })
      });

      setAuth(data);
      const redirectTarget =
        new URLSearchParams(window.location.search).get("redirect") || "/";
      router.replace(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`container ${styles.wrap}`}>
      <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
