import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';

const bodySchema = z.object({
  slug: z.string().trim().min(1).max(100),
  /** QR table token from the scanned URL, when the customer used a table QR. */
  t: z.string().trim().max(100).optional(),
  locale: z.string().max(8).optional(),
  /** Dish ids that scrolled into view — the beacon batches them. */
  itemIds: z.array(z.string().uuid()).max(50)
});

/**
 * Public dish-impression beacon: the customer's menu reports which dishes
 * were seen (once per dish per load, client-deduped). No session — the
 * active slug resolves the tenant, the repo filters ids by ownership, and
 * a stale/foreign table token is simply ignored. Read-only surface stays
 * unchanged; this is the one public write path next to `placeOrderAction`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ok: false}, {status: 400});
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ok: false}, {status: 400});

  const restaurant = await restaurantsRepo.findBySlug(parsed.data.slug);
  if (!restaurant || !restaurant.isActive || restaurant.slug !== parsed.data.slug) {
    return Response.json({ok: false}, {status: 404});
  }

  let tableId: string | null = null;
  if (parsed.data.t) {
    const resolved = await tablesByToken.findActive(parsed.data.t);
    if (resolved && resolved.restaurant.id === restaurant.id) tableId = resolved.table.id;
  }

  const rawLocale = parsed.data.locale ?? routing.defaultLocale;
  const locale = (routing.locales as readonly string[]).includes(rawLocale)
    ? rawLocale
    : routing.defaultLocale;

  await createRestaurantRepos(restaurant.id).analytics.recordItemViews(parsed.data.itemIds, {
    tableId,
    locale
  });
  return Response.json({ok: true});
}
