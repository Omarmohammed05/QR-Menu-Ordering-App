import {describe, expect, it} from 'vitest';
import {parseEnv} from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://menu:secret@localhost:5432/menu',
  BETTER_AUTH_SECRET: 'a'.repeat(44),
  NEXT_PUBLIC_APP_URL: 'https://menu.example.com/'
};

describe('env schema', () => {
  it('accepts a valid environment and defaults NODE_ENV', () => {
    const parsed = parseEnv(validEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(parsed.AUTH_URL).toBeUndefined();
  });

  it('normalizes a trailing slash off NEXT_PUBLIC_APP_URL', () => {
    expect(parseEnv(validEnv).NEXT_PUBLIC_APP_URL).toBe('https://menu.example.com');
  });

  it('rejects a missing NEXT_PUBLIC_APP_URL', () => {
    const {NEXT_PUBLIC_APP_URL, ...withoutUrl} = validEnv;
    expect(NEXT_PUBLIC_APP_URL).toBeDefined();
    expect(() => parseEnv(withoutUrl)).toThrowError(/NEXT_PUBLIC_APP_URL/);
  });

  it('rejects a non-absolute NEXT_PUBLIC_APP_URL', () => {
    expect(() => parseEnv({...validEnv, NEXT_PUBLIC_APP_URL: 'menu.example.com'})).toThrowError(
      /NEXT_PUBLIC_APP_URL/
    );
  });

  it('keeps IMGBB_API_KEY optional', () => {
    expect(parseEnv(validEnv).IMGBB_API_KEY).toBeUndefined();
    expect(parseEnv({...validEnv, IMGBB_API_KEY: 'abc123'}).IMGBB_API_KEY).toBe('abc123');
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      parseEnv({BETTER_AUTH_SECRET: 'a'.repeat(44), NEXT_PUBLIC_APP_URL: 'https://x.example'})
    ).toThrowError(/DATABASE_URL/);
  });

  it('rejects a short BETTER_AUTH_SECRET', () => {
    expect(() =>
      parseEnv({...validEnv, BETTER_AUTH_SECRET: 'short'})
    ).toThrowError(/BETTER_AUTH_SECRET/);
  });

  it('rejects an invalid NODE_ENV', () => {
    expect(() =>
      parseEnv({...validEnv, NODE_ENV: 'staging'})
    ).toThrowError();
  });

  it('falls back to an empty shell during `next build` so page-data collection survives a build worker without runtime secrets', () => {
    const shell = parseEnv({}, 'phase-production-build');
    expect(shell.DATABASE_URL).toBeUndefined();
  });

  it('still fails fast outside the build phase', () => {
    expect(() => parseEnv({}, 'phase-production-server')).toThrowError(/DATABASE_URL/);
  });
});
