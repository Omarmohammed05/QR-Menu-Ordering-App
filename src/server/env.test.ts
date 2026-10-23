import {describe, expect, it} from 'vitest';
import {parseEnv} from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://menu:secret@localhost:5432/menu',
  BETTER_AUTH_SECRET: 'a'.repeat(44)
};

describe('env schema', () => {
  it('accepts a valid environment and defaults NODE_ENV', () => {
    const parsed = parseEnv(validEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(parsed.AUTH_URL).toBeUndefined();
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() =>
      parseEnv({BETTER_AUTH_SECRET: 'a'.repeat(44)})
    ).toThrowError(/DATABASE_URL/);
  });

  it('rejects a short BETTER_AUTH_SECRET', () => {
    expect(() =>
      parseEnv({DATABASE_URL: validEnv.DATABASE_URL, BETTER_AUTH_SECRET: 'short'})
    ).toThrowError(/BETTER_AUTH_SECRET/);
  });

  it('rejects an invalid NODE_ENV', () => {
    expect(() =>
      parseEnv({...validEnv, NODE_ENV: 'staging'})
    ).toThrowError();
  });
});
