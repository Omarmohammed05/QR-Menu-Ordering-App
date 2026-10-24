'use client';

import {useEffect, useRef} from 'react';

type Props = {
  slug: string;
  tableToken: string | null;
};

const FLUSH_MS = 2_500;

/**
 * Dish-impression telemetry for the analytics board: a dish counts as seen
 * when at least half of its row scrolls into view — once per load. Batches
 * POST to the public beacon endpoint with `sendBeacon`, so leaving the menu
 * (or navigating straight to checkout) never loses views.
 */
export function DishViewTracker({slug, tableToken}: Props) {
  const seenRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flush = () => {
      const itemIds = [...pendingRef.current];
      pendingRef.current.clear();
      if (itemIds.length === 0) return;
      const body = JSON.stringify({slug, t: tableToken ?? undefined, itemIds});
      navigator.sendBeacon('/api/menu-views', new Blob([body], {type: 'application/json'}));
    };

    const schedule = () => {
      if (timerRef.current == null) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flush();
        }, FLUSH_MS);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let added = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.menuItemId;
          if (id && !seenRef.current.has(id)) {
            seenRef.current.add(id);
            pendingRef.current.add(id);
            added = true;
          }
        }
        if (added) schedule();
      },
      {threshold: 0.5}
    );

    document.querySelectorAll<HTMLElement>('[data-menu-item-id]').forEach((row) => {
      observer.observe(row);
    });
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);

    return () => {
      observer.disconnect();
      window.removeEventListener('pagehide', onHide);
      if (timerRef.current != null) clearTimeout(timerRef.current);
      timerRef.current = null;
      flush();
    };
  }, [slug, tableToken]);

  return null;
}
