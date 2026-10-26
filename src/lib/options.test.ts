import {describe, expect, it} from 'vitest';
import {
  computeUnitPricePiastres,
  describeSelection,
  isPickOne,
  missingRequiredGroups,
  type PublicOptionGroup
} from './options';

const sizeGroup: PublicOptionGroup = {
  id: 'g-size',
  nameAr: 'الحجم',
  nameEn: 'Size',
  kind: 'size',
  isRequired: true,
  choices: [
    {id: 'c-md', nameAr: 'وسط', nameEn: 'Medium', priceDeltaPiastres: 0},
    {id: 'c-lg', nameAr: 'كبير', nameEn: 'Large', priceDeltaPiastres: 1500}
  ]
};

const spiceGroup: PublicOptionGroup = {
  id: 'g-spice',
  nameAr: 'مستوى الحار',
  nameEn: 'Spice level',
  kind: 'modifier',
  isRequired: true,
  choices: [
    {id: 'c-mild', nameAr: 'عادي', nameEn: 'Mild', priceDeltaPiastres: 0},
    {id: 'c-hot', nameAr: 'حراق', nameEn: 'Hot', priceDeltaPiastres: 0}
  ]
};

const addonGroup: PublicOptionGroup = {
  id: 'g-addon',
  nameAr: 'إضافات',
  nameEn: 'Add-ons',
  kind: 'addon',
  isRequired: false,
  choices: [
    {id: 'c-sauce', nameAr: 'صوص إضافي', nameEn: 'Extra sauce', priceDeltaPiastres: 1000},
    {id: 'c-onion', nameAr: 'بصل مقرمش', nameEn: 'Crispy onion', priceDeltaPiastres: 500}
  ]
};

const groups = [sizeGroup, spiceGroup, addonGroup];

describe('isPickOne', () => {
  it('sizes and required modifiers pick exactly one', () => {
    expect(isPickOne(sizeGroup)).toBe(true);
    expect(isPickOne(spiceGroup)).toBe(true);
  });

  it('optional modifiers and add-ons pick any number', () => {
    expect(isPickOne({...spiceGroup, isRequired: false})).toBe(false);
    expect(isPickOne(addonGroup)).toBe(false);
  });
});

describe('missingRequiredGroups', () => {
  it('lists every required group the customer has not answered', () => {
    const missing = missingRequiredGroups(groups, []);
    expect(missing.map((group) => group.id)).toEqual(['g-size', 'g-spice']);
  });

  it('a group counts as answered once any of its choices is selected', () => {
    expect(missingRequiredGroups(groups, ['c-lg', 'c-mild'])).toEqual([]);
  });

  it('ignores optional groups even with nothing selected', () => {
    expect(missingRequiredGroups([addonGroup], [])).toEqual([]);
  });
});

describe('computeUnitPricePiastres', () => {
  it('returns the base price when nothing is selected', () => {
    expect(computeUnitPricePiastres(5000, groups, [])).toBe(5000);
  });

  it('adds the deltas of every selected choice (pick-one and add-ons)', () => {
    expect(computeUnitPricePiastres(5000, groups, ['c-lg', 'c-mild', 'c-sauce'])).toBe(7500);
  });

  it('ignores unknown ids instead of NaN-ing the total', () => {
    expect(computeUnitPricePiastres(5000, groups, ['not-a-choice'])).toBe(5000);
  });
});

describe('describeSelection', () => {
  it('names each answered group with its choices in Arabic', () => {
    const text = describeSelection('ar', groups, ['c-lg', 'c-hot']);
    expect(text).toContain('الحجم: كبير');
    expect(text).toContain('مستوى الحار: حراق');
    expect(text).not.toContain('إضافات');
  });

  it('sums the deltas of an add-on group into one suffix', () => {
    const text = describeSelection('en', groups, ['c-sauce', 'c-onion']);
    expect(text).toContain('Add-ons: Extra sauce + Crispy onion (EGP\u00A015)');
  });

  it('returns an empty string when nothing is selected', () => {
    expect(describeSelection('en', groups, [])).toBe('');
  });
});
