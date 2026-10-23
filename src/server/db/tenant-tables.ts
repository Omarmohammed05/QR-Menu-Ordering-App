/**
 * The ONLY import surface for tenant-owned tables (spec 3.2).
 * Files outside /src/server/repos and /src/server/db are blocked from importing
 * this module by an ESLint no-restricted-imports rule — all tenant queries go
 * through createRestaurantRepo() or the platform repos.
 */
export {
  restaurants,
  restaurantMembers,
  invitations,
  menuCategories,
  menuItems,
  itemPhotos,
} from "./schema";
