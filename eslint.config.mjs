import {globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts', 'research/**']),
  ...nextVitals,
  ...nextTs
];

export default config;
