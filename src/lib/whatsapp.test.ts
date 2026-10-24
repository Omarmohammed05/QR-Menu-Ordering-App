import {describe, expect, it} from 'vitest';
import {buildOrderMessage, buildWhatsAppUrl} from './whatsapp';

const formatPrice = (piastres: number) => `${piastres / 100} ج.م`;

describe('buildOrderMessage', () => {
  it('renders items, total and customer details in Arabic', () => {
    const text = buildOrderMessage({
      restaurantName: 'مطعم النور',
      orderLabel: 'طلب #a1b2c3',
      tableLabel: 'طاولة ٣',
      items: [
        {name: 'كفتة', quantity: 2, lineTotalPiastres: 17000},
        {name: 'حمص', quantity: 1, lineTotalPiastres: 3000}
      ],
      totalPiastres: 20000,
      customerName: 'أحمد',
      customerPhone: '+201112223334',
      note: 'بدون بصل',
      formatPrice
    });
    expect(text).toContain('مطعم النور — طلب #a1b2c3');
    expect(text).toContain('طاولة ٣');
    expect(text).toContain('كفتة × 2 — 170 ج.م');
    expect(text).toContain('الإجمالي: 200 ج.م');
    expect(text).toContain('الاسم: أحمد');
    expect(text).toContain('بدون بصل');
  });

  it('omits optional fields entirely', () => {
    const text = buildOrderMessage({
      restaurantName: 'مطعم',
      orderLabel: 'طلب',
      items: [{name: 'شوربة', quantity: 1, lineTotalPiastres: 5000}],
      totalPiastres: 5000,
      formatPrice
    });
    expect(text).not.toContain('الاسم');
    expect(text).not.toContain('ملاحظة');
    expect(text).not.toContain('طاولة');
  });
});

describe('buildWhatsAppUrl', () => {
  it('strips non-digits from the number and encodes the text', () => {
    const url = buildWhatsAppUrl('+20 100 555 0199', 'طلب جديد');
    expect(url).toBe(`https://wa.me/201005550199?text=${encodeURIComponent('طلب جديد')}`);
  });
});
