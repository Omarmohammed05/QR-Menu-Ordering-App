import {createCategoriesRepo} from './categories';
import {createItemsRepo} from './items';
import {createOrdersRepo} from './orders';

export {restaurantsRepo, type NewRestaurant} from './restaurants';
export {
  membersRepo,
  type Membership,
  type MembershipRole
} from './members';
export {type CategoriesRepo, type NewCategory} from './categories';
export {type ItemsRepo, type NewMenuItem} from './items';
export {type NewOrder, type NewOrderItem, type OrdersRepo} from './orders';

/**
 * The scoped repo factory (ADR-002): build one repos bundle per request with
 * the restaurant resolved from the session/route, then use it for all tenant
 * data access. Every member injects and filters by this `restaurantId` —
 * callers never pass it, so tenant scoping cannot be forgotten or forged.
 *
 * Tenant-root lookups (login, QR-slug resolution) use `restaurantsRepo`;
 * session→tenant resolution (dashboard, onboarding) uses `membersRepo`.
 */
export function createRestaurantRepos(restaurantId: string) {
  return {
    id: restaurantId,
    categories: createCategoriesRepo(restaurantId),
    items: createItemsRepo(restaurantId),
    orders: createOrdersRepo(restaurantId)
  };
}

export type RestaurantRepos = ReturnType<typeof createRestaurantRepos>;
