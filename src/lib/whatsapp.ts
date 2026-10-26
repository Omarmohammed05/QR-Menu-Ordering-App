/**
 * WhatsApp order handoff (product decision): the order is persisted first,
 * then the customer continues on WhatsApp with a prefilled message. No API
 * integration — just a `wa.me` deep link.
 */

import type {OrderItemOptionSnapshot} from '@/server/db/schema/orders';

export type OrderMessageItem = {
  name: string;
  quantity: number;
  lineTotalPiastres: number;
  /** Selected sizes/modifiers/add-ons, frozen snapshots on the order line. */
  options?: OrderItemOptionSnapshot[];
};

export type OrderMessage = {
  restaurantName: string;
  orderLabel: string;
  /** Where the order is consumed — drives the "نوع الطلب" line. */
  orderType: 'dine_in' | 'delivery' | 'takeaway';
  /** Dine-in: the scanned table's label ("طاولة ٣"). */
  tableLabel?: string | null;
  /** Delivery: the address the customer typed on the checkout sheet. */
  deliveryAddress?: string | null;
  items: OrderMessageItem[];
  totalPiastres: number;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  /** Where the customer follows their order — always included when known. */
  statusUrl?: string | null;
  /** How the customer pays — cash by default. */
  paymentMethod?: 'cash' | 'instapay';
  /** InstaPay address shown in the message when paying by InstaPay. */
  instapayHandle?: string | null;
  /** imgbb screenshot of the InstaPay transfer, when attached. */
  paymentProofUrl?: string | null;
  formatPrice: (piastres: number) => string;
};

/** "الحجم: كيلو، الإضافات: جبنة (+15 ج.م)" — one line's selected options. */
export function formatItemOptions(
  options: OrderItemOptionSnapshot[],
  formatPrice: (piastres: number) => string
): string | null {
  if (!options || options.length === 0) return null;
  const byGroup = new Map<string, string[]>();
  for (const option of options) {
    const names = byGroup.get(option.groupNameAr) ?? [];
    const delta =
      option.priceDeltaPiastres !== 0 ? ` (+${formatPrice(option.priceDeltaPiastres)})` : '';
    names.push(`${option.nameAr}${delta}`);
    byGroup.set(option.groupNameAr, names);
  }
  return [...byGroup.entries()].map(([group, names]) => `${group}: ${names.join('، ')}`).join('، ');
}

/** Arabic-first message — the customer sends it to the restaurant as-is. */
export function buildOrderMessage(message: OrderMessage): string {
  const lines: string[] = [`${message.restaurantName} — ${message.orderLabel}`];
  if (message.orderType === 'dine_in' && message.tableLabel) {
    lines.push(`نوع الطلب: داخل المطعم — ${message.tableLabel}`);
  } else if (message.orderType === 'dine_in') {
    lines.push('نوع الطلب: داخل المطعم');
  } else if (message.orderType === 'delivery') {
    lines.push('نوع الطلب: توصيل للمنزل');
    if (message.deliveryAddress) lines.push(`العنوان: ${message.deliveryAddress}`);
  } else {
    lines.push('نوع الطلب: استلام من الفرع');
  }
  lines.push('');
  for (const item of message.items) {
    const options = item.options ? formatItemOptions(item.options, message.formatPrice) : null;
    const name = options ? `${item.name} (${options})` : item.name;
    lines.push(`${name} × ${item.quantity} — ${message.formatPrice(item.lineTotalPiastres)}`);
  }
  lines.push('', `الإجمالي: ${message.formatPrice(message.totalPiastres)}`);
  if (message.customerName) lines.push('', `الاسم: ${message.customerName}`);
  if (message.customerPhone) lines.push(`رقم الهاتف: ${message.customerPhone}`);
  if (message.note) lines.push(`ملاحظة: ${message.note}`);
  if (message.paymentMethod === 'instapay') {
    lines.push('', 'طريقة الدفع: إنستاباي');
    if (message.instapayHandle) lines.push(`حوالة إلى: ${message.instapayHandle}`);
    if (message.paymentProofUrl) lines.push(`إثبات الدفع: ${message.paymentProofUrl}`);
  } else {
    lines.push('', 'طريقة الدفع: كاش');
  }
  if (message.statusUrl) lines.push('', `متابعة الطلب: ${message.statusUrl}`);
  return lines.join('\n');
}

/** `https://wa.me/<e164 without +>?text=<encoded message>` deep link. */
export function buildWhatsAppUrl(whatsappNumber: string, text: string): string {
  const digits = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
