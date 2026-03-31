"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthState, CartItem, Product } from "@/lib/types";

const DEFAULT_AUTH_STATE: AuthState = {
  token: null,
  user: null
};

type AppContextType = {
  cart: CartItem[];
  auth: AuthState;
  isHydrated: boolean;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setAuth: (auth: AuthState) => void;
  logout: () => void;
  cartCount: number;
  cartTotal: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [auth, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedCart = safeParse<CartItem[]>(localStorage.getItem("cart"), []);
    const storedAuth = safeParse<AuthState>(localStorage.getItem("auth"), DEFAULT_AUTH_STATE);

    setCart(storedCart);
    setAuthState(storedAuth);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth, isHydrated]);

  const addToCart = (product: Product, qty = 1) => {
    const safeQty = Math.max(1, Math.min(product.stock || 1, qty));

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.stock, item.quantity + safeQty)
              }
            : item
        );
      }

      return [...current, { ...product, quantity: safeQty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, qty)) }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const setAuth = (nextAuth: AuthState) => {
    setAuthState(nextAuth);
  };

  const logout = () => {
    setAuthState(DEFAULT_AUTH_STATE);
    localStorage.removeItem("auth");
  };

  const value = useMemo(
    () => ({
      cart,
      auth,
      isHydrated,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      setAuth,
      logout,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      cartTotal: cart.reduce((sum, item) => sum + item.quantity * item.price, 0)
    }),
    [cart, auth, isHydrated]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
