import {createCategoriesRepo} from './categories';
import {createHoursRepo} from './hours';
import {createTeamRepo} from './members';
import {createItemsRepo} from './items';
import {createOptionsRepo} from './options';
import {createOrdersRepo} from './orders';
import {createTablesRepo} from './tables';
import {createAddressesRepo} from './addresses';
import {createAnalyticsRepo} from './analytics';

export {restaurantsRepo, type NewRestaurant} from './restaurants';
export {
  membersRepo,
  type Membership,
  type MembershipRole,
  type Restaurant,
  type TeamMember,
  type TeamRepo
} from './members';
export {type CategoriesRepo, type NewCategory} from './categories';
export {type ItemsRepo, type NewMenuItem} from './items';
export {
  type NewOrder,
  type NewOrderItem,
  type OrderItemOptionSnapshot,
  type OrderStatus,
  type OrdersRepo,
  type OrderWithItems
} from './orders';
export {tablesByToken, type NewTable, type TablesRepo} from './tables';
export {type HoursRepo} from './hours';
export {
  invitesRepo,
  generateInviteCode
} from './invites';
export {type AddressesRepo, type NewAddress} from './addresses';
export {type AnalyticsRepo, type DailyPoint, type TopDish} from './analytics';
export {type NewOptionGroup, type OptionGroup, type OptionsRepo} from './options';
export {durationsRepo, type SubscriptionDuration} from './durations';

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
    options: createOptionsRepo(restaurantId),
    orders: createOrdersRepo(restaurantId),
    tables: createTablesRepo(restaurantId),
    hours: createHoursRepo(restaurantId),
    addresses: createAddressesRepo(restaurantId),
    analytics: createAnalyticsRepo(restaurantId),
    team: createTeamRepo(restaurantId)
  };
}

export type RestaurantRepos = ReturnType<typeof createRestaurantRepos>;
