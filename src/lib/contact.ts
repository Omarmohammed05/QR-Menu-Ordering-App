import {buildWhatsAppUrl} from '@/lib/whatsapp';

/**
 * The platform owner's WhatsApp — the only channel for new accounts, because
 * public sign-up is closed: restaurant onboarding happens through invite
 * codes the owner issues from the admin page.
 */
export const ADMIN_WHATSAPP_NUMBER = '+201097860960';

/** `wa.me` deep link with a prefilled (localized) message to the owner. */
export function contactAdminUrl(prefilledText: string): string {
  return buildWhatsAppUrl(ADMIN_WHATSAPP_NUMBER, prefilledText);
}
