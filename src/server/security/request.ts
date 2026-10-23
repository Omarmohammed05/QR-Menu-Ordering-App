import { headers } from "next/headers";

/** Best-effort client IP for rate limiting (first hop of x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
