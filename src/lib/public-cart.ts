import type {PublicMenuItem, PublicMenuOption} from '@/server/public-menu';

/**
 * The customer's cart, shared between the menu page and the dish detail page
 * through sessionStorage (per restaurant, per browser tab session). The
 * server re-prices everything anyway — this only carries ids and quantities.
 */
export type CartLine = {
  itemId: string;
  /** Selected option ids — the same dish with different options is its own line. */
  optionIds: string[];
  quantity: number;
};

/** Stable identity of a cart line: dish + its exact option selection. */
export function lineKey(itemId: string, optionIds: string[]): string {
  return optionIds.length === 0 ? itemId : `${itemId}|${[...optionIds].sort().join(',')}`;
}

function storageKey(slug: string): string {
  return `menu-cart:${slug}`;
}

export function loadCart(slug: string): CartLine[] {
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line?.itemId === 'string' &&
        Array.isArray(line?.optionIds) &&
        typeof line?.quantity === 'number' &&
        line.quantity > 0
    );
  } catch {
    return [];
  }
}

export function saveCart(slug: string, lines: CartLine[]): void {
  try {
    sessionStorage.setItem(storageKey(slug), JSON.stringify(lines));
  } catch {
    /* storage unavailable — the in-memory cart still works for this page */
  }
}

export function clearCart(slug: string): void {
  try {
    sessionStorage.removeItem(storageKey(slug));
  } catch {
    /* ignore */
  }
}

/** Merge a line into the cart: same dish + same options bumps the quantity. */
export function addToCart(slug: string, line: CartLine, maxQuantity = 50): CartLine[] {
  const lines = loadCart(slug);
  const key = lineKey(line.itemId, line.optionIds);
  const existing = lines.find((candidate) => lineKey(candidate.itemId, candidate.optionIds) === key);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + line.quantity, maxQuantity);
  } else {
    lines.push(line);
  }
  saveCart(slug, lines);
  return lines;
}

/** Unit price of a dish with a selection of its options (piastres, display-only). */
export function unitPiastres(item: PublicMenuItem, optionIds: string[]): number {
  const byId = new Map<string, PublicMenuOption>(item.options.map((o) => [o.id, o]));
  const delta = optionIds.reduce((sum, id) => sum + (byId.get(id)?.priceDeltaPiastres ?? 0), 0);
  return item.pricePiastres + delta;
}
