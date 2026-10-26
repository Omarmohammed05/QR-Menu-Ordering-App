'use client';

import type {ButtonHTMLAttributes, ReactNode} from 'react';
import {useDemoNotice} from './demo-notice';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {children: ReactNode};

/**
 * Every button that would mutate data on the real dashboard: in the demo it
 * only surfaces the polite read-only notice — the gesture is preserved, the
 * write never happens.
 */
export function DemoButton({children, onClick, ...rest}: Props) {
  const fireNotice = useDemoNotice();
  return (
    <button
      type="button"
      onClick={(event) => {
        fireNotice();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
