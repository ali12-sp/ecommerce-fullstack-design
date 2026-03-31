"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import type { AuthResponse } from "@/lib/types";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      setAuth(data);
      const redirectTarget =
        new URLSearchParams(window.location.search).get("redirect") || "/";
      router.replace(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`container ${styles.wrap}`}>
      <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
        <h1>Login</h1>
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
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
