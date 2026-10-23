/** Central RBAC matrix (spec section 5). Unit-tested in tests/unit/rbac.test.ts. */

export type MemberRole = "owner" | "manager" | "staff";

export type Permission =
  | "orders.view"
  | "orders.advance"
  | "orders.cancel"
  | "menu.edit"
  | "restaurant.edit"
  | "members.manage"
  | "platform.manage";

const MATRIX: Record<Permission, readonly MemberRole[]> = {
  "orders.view": ["staff", "manager", "owner"],
  "orders.advance": ["staff", "manager", "owner"],
  "orders.cancel": ["manager", "owner"],
  "menu.edit": ["manager", "owner"],
  "restaurant.edit": ["owner"],
  "members.manage": ["owner"],
  "platform.manage": [],
};

export type Principal = {
  memberRole: MemberRole | null;
  superAdmin: boolean;
};

export function can(principal: Principal, permission: Permission): boolean {
  if (principal.superAdmin) return true;
  if (!principal.memberRole) return false;
  return MATRIX[permission].includes(principal.memberRole);
}
