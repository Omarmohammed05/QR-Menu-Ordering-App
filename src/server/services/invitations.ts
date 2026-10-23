import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "@/server/db/client";
import { auth } from "@/server/auth";
import { logger } from "@/server/logger";
import {
  claimInvitationAndAddMember,
  getInvitationContextByTokenHash,
} from "@/server/repos/invitation-claims";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(input: {
  restaurantId: string;
  email: string;
  role: "owner" | "manager" | "staff";
}): Promise<string> {
  const token = nanoid(48);
  await createRestaurantRepo(input.restaurantId).invitations.create({
    email: input.email,
    role: input.role,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  });
  return token;
}

export type InvitationContext =
  | {
      valid: true;
      invitationId: string;
      email: string;
      role: "owner" | "manager" | "staff";
      restaurantName: { ar: string; en?: string };
    }
  | { valid: false };

export async function getInvitationContext(token: string): Promise<InvitationContext> {
  const row = await getInvitationContextByTokenHash(hashToken(token));
  if (!row || row.acceptedAt || row.expiresAt.getTime() < Date.now()) {
    return { valid: false };
  }
  return {
    valid: true,
    invitationId: row.invitationId,
    email: row.email,
    role: row.role,
    restaurantName: row.restaurantName,
  };
}

export type AcceptInvitationResult =
  { ok: true } | { ok: false; code: "invalid" | "user_exists" | "internal" };

/**
 * Accepts an invitation: creates the invited user (invite-only signup,
 * ADR-002) and attaches the membership atomically.
 */
export async function acceptInvitation(input: {
  token: string;
  name: string;
  password: string;
}): Promise<AcceptInvitationResult> {
  const context = await getInvitationContext(input.token);
  if (!context.valid) {
    return { ok: false, code: "invalid" };
  }

  const signUp = await auth.api.signUpEmail({
    body: { email: context.email, password: input.password, name: input.name },
  });
  if ("error" in signUp && signUp.error) {
    const code = (signUp.error as { code?: string }).code;
    if (code === "USER_ALREADY_EXISTS" || code === "USER_CAN_NOT_BE_CREATED") {
      return { ok: false, code: "user_exists" };
    }
    logger.error({ code }, "sign up during invite accept failed");
    return { ok: false, code: "internal" };
  }
  const userId = signUp.user.id;

  try {
    await db.transaction(async (tx) => {
      await claimInvitationAndAddMember(tx, {
        invitationId: context.invitationId,
        userId,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_CLAIMED") {
      return { ok: false, code: "invalid" };
    }
    logger.error({ err: error }, "accept invitation failed");
    return { ok: false, code: "internal" };
  }
  return { ok: true };
}
