"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  id: string;
  name: string;
  pricePiastres: number;
  qty: number;
};

type CartApi = {
  lines: CartLine[];
  qtyOf: (id: string) => number;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

/** In-memory customer cart for a single QR-visit (ADR-007: nothing persisted). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((current) =>
      current.some((candidate) => candidate.id === line.id)
        ? current.map((candidate) =>
            candidate.id === line.id ? { ...candidate, qty: candidate.qty + 1 } : candidate,
          )
        : [...current, { ...line, qty: 1 }],
    );
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((candidate) => candidate.id !== id)
        : current.map((candidate) => (candidate.id === id ? { ...candidate, qty } : candidate)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const api = useMemo<CartApi>(
    () => ({
      lines,
      qtyOf: (id) => lines.find((candidate) => candidate.id === id)?.qty ?? 0,
      add,
      setQty,
      clear,
    }),
    [lines, add, setQty, clear],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return cart;
}
