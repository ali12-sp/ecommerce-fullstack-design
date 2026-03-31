const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function getAuthHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export { API_URL };
