import { describe, expect, it } from "vitest";
import { can, type MemberRole, type Permission } from "@/server/auth/rbac";

const ROLES: MemberRole[] = ["staff", "manager", "owner"];

// Spec section 5 matrix. staff ✓, manager ✓✓, owner ✓✓✓, super_admin all.
const EXPECTED: Record<Permission, Record<MemberRole, boolean>> = {
  "orders.view": { staff: true, manager: true, owner: true },
  "orders.advance": { staff: true, manager: true, owner: true },
  "orders.cancel": { staff: false, manager: true, owner: true },
  "menu.edit": { staff: false, manager: true, owner: true },
  "restaurant.edit": { staff: false, manager: false, owner: true },
  "members.manage": { staff: false, manager: false, owner: true },
  "platform.manage": { staff: false, manager: false, owner: false },
};

describe("can() permission matrix", () => {
  it("matches the spec matrix for every role and permission", () => {
    for (const [permission, expectations] of Object.entries(EXPECTED) as [
      Permission,
      Record<MemberRole, boolean>,
    ][]) {
      for (const role of ROLES) {
        expect(
          can({ memberRole: role, superAdmin: false }, permission),
          `${role} should ${expectations[role] ? "have" : "not have"} ${permission}`,
        ).toBe(expectations[role]);
      }
    }
  });

  it("super_admin has every permission", () => {
    for (const permission of Object.keys(EXPECTED) as Permission[]) {
      expect(can({ memberRole: null, superAdmin: true }, permission)).toBe(true);
    }
  });

  it("denies by default for principals with no role", () => {
    for (const permission of Object.keys(EXPECTED) as Permission[]) {
      expect(can({ memberRole: null, superAdmin: false }, permission)).toBe(false);
    }
  });
});
