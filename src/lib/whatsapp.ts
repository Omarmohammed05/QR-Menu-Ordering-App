/**
 * WhatsApp order handoff (product decision): the order is persisted first,
 * then the customer continues on WhatsApp with a prefilled message. No API
 * integration — just a `wa.me` deep link.
 */

export type OrderMessageItem = {
  name: string;
  quantity: number;
  lineTotalPiastres: number;
};

export type OrderMessage = {
  restaurantName: string;
  orderLabel: string;
  tableLabel?: string | null;
  items: OrderMessageItem[];
  totalPiastres: number;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  /** Where the customer follows their order — always included when known. */
  statusUrl?: string | null;
  formatPrice: (piastres: number) => string;
};

/** Arabic-first message — the customer sends it to the restaurant as-is. */
export function buildOrderMessage(message: OrderMessage): string {
  const lines: string[] = [`${message.restaurantName} — ${message.orderLabel}`];
  if (message.tableLabel) lines.push(message.tableLabel);
  lines.push('');
  for (const item of message.items) {
    lines.push(`${item.name} × ${item.quantity} — ${message.formatPrice(item.lineTotalPiastres)}`);
  }
  lines.push('', `الإجمالي: ${message.formatPrice(message.totalPiastres)}`);
  if (message.customerName) lines.push('', `الاسم: ${message.customerName}`);
  if (message.customerPhone) lines.push(`رقم الهاتف: ${message.customerPhone}`);
  if (message.note) lines.push(`ملاحظة: ${message.note}`);
  if (message.statusUrl) lines.push('', `متابعة الطلب: ${message.statusUrl}`);
  return lines.join('\n');
}

/** `https://wa.me/<e164 without +>?text=<encoded message>` deep link. */
export function buildWhatsAppUrl(whatsappNumber: string, text: string): string {
  const digits = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
