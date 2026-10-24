import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {restaurantsRepo} from '@/server/db/repos';
import {DemoShell} from '@/components/dashboard-demo/demo-shell';

export const dynamic = 'force-dynamic';

/**
 * Public read-only demo of the whole dashboard: every sub-route renders the
 * seeded `demo` restaurant's data with mutating controls removed. No session
 * — the layout resolves the tenant once and hands the shell its name.
 */
export default async function DemoLayout({children}: {children: ReactNode}) {
  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();

  return <DemoShell restaurantName={restaurant.nameAr}>{children}</DemoShell>;
}
