import { build } from 'esbuild';

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  external: ['@whiskeysockets/baileys', 'express', 'qrcode', 'pino'],
}).catch(() => process.exit(1));
