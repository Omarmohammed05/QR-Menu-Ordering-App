'use client';

import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';

const DemoNoticeContext = createContext<() => void>(() => {});

/** Fires the read-only notice — the demo's only response to any mutation. */
export function useDemoNotice() {
  return useContext(DemoNoticeContext);
}

/**
 * Shared notice for the whole `/dashboard-demo` tree: any save/delete/accept
 * attempt from any demo page surfaces the polite subscribe toast instead.
 */
export function DemoNoticeProvider({children}: {children: ReactNode}) {
  const t = useTranslations('dashboardDemo');
  const [visible, setVisible] = useState(false);
  const fireNotice = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <DemoNoticeContext.Provider value={fireNotice}>
      {children}
      {visible ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-base border border-accent/30 bg-surface p-3 text-center text-sm shadow-[0_16px_40px_-16px_rgb(0_0_0/0.3)] animate-fade-in"
        >
          {t('notice')}
        </div>
      ) : null}
    </DemoNoticeContext.Provider>
  );
}
