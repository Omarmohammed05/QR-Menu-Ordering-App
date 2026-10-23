"use server";

import { z } from "zod";
import { acceptInvitation } from "@/server/services/invitations";
import { publicAction } from "./secure";

const acceptInvitationSchema = z.strictObject({
  token: z.string().min(20).max(64),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(10).max(128),
});

export const acceptInvitationAction = publicAction({
  schema: acceptInvitationSchema,
  rateLimit: { scope: "invite-accept", limit: 10, windowMs: 10 * 60_000 },
  handler: async (input) => acceptInvitation(input),
});
