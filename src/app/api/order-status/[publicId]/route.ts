import {z} from 'zod';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';

type Params = {params: Promise<{publicId: string}>};

const slugSchema = z.string().trim().min(1).max(100);

/**
 * Public order-status read for the customer status page's poller (spec §6):
 * one unguessable `publicId` inside one tenant. Reads only — the write path
 * stays the server action. Enumerating other orders requires the slug AND a
 * 16-char random id, and a miss is a plain 404.
 */
export async function GET(request: Request, {params}: Params) {
  const {publicId} = await params;
  if (!z.string().min(10).max(64).safeParse(publicId).success) {
    return Response.json({error: 'not_found'}, {status: 404});
  }

  const slug = slugSchema.safeParse(new URL(request.url).searchParams.get('slug') ?? '');
  if (!slug.success) return Response.json({error: 'not_found'}, {status: 404});

  const restaurant = await restaurantsRepo.findBySlug(slug.data);
  if (!restaurant) return Response.json({error: 'not_found'}, {status: 404});

  const order = await createRestaurantRepos(restaurant.id).orders.findByPublicIdLite(publicId);
  if (!order) return Response.json({error: 'not_found'}, {status: 404});

  return Response.json(
    {status: order.status, statusUpdatedAt: order.statusUpdatedAt},
    {headers: {'Cache-Control': 'no-store'}}
  );
}
