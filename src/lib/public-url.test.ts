import {describe, expect, it} from 'vitest';
import {buildPublicMenuUrl, publicMenuPath} from './public-url';

describe('publicMenuPath', () => {
  it('keeps Arabic (default) unprefixed', () => {
    expect(publicMenuPath('bait-el-sham', 'ar')).toBe('/bait-el-sham');
  });

  it('prefixes English with /en', () => {
    expect(publicMenuPath('bait-el-sham', 'en')).toBe('/en/bait-el-sham');
  });

  it('defaults to Arabic when no locale is given', () => {
    expect(publicMenuPath('bait-el-sham')).toBe('/bait-el-sham');
  });

  it('appends the table QR token as ?t=', () => {
    expect(publicMenuPath('bait-el-sham', 'ar', 'tok-123')).toBe('/bait-el-sham?t=tok-123');
    expect(publicMenuPath('bait-el-sham', 'en', 'tok-123')).toBe('/en/bait-el-sham?t=tok-123');
  });
});

describe('buildPublicMenuUrl', () => {
  it('joins the base (trailing slash trimmed) with the public path', () => {
    expect(buildPublicMenuUrl('https://menu.example.com/', 'bait-el-sham')).toBe(
      'https://menu.example.com/bait-el-sham'
    );
  });

  it('builds the QR shape: {APP_URL}/{slug}?t={tableCode}', () => {
    expect(buildPublicMenuUrl('https://menu.example.com', 'bait-el-sham', 'ar', 'abc')).toBe(
      'https://menu.example.com/bait-el-sham?t=abc'
    );
  });
});
