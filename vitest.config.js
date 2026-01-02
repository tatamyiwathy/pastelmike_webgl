import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: ['html-encoding-sniffer', '@exodus/bytes'],
    },
    alias: {
      // ソースコードの 'gl-matrix' を ローカルのパッケージに結びつける
      'gl-matrix': 'gl-matrix'
    }
  },
});