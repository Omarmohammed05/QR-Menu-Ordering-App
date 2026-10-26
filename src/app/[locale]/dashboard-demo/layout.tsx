import type {ReactNode} from 'react';
import {DemoShell} from '@/components/dashboard-demo/demo-shell';

/**
 * Shared chrome for every `/dashboard-demo/*` page: sidebar, drawer, header,
 * read-only banner and the notice toast — mirroring the real dashboard shell
 * with zero server dependencies.
 */
export default function DashboardDemoLayout({children}: {children: ReactNode}) {
  return <DemoShell>{children}</DemoShell>;
}
