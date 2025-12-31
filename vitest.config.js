import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      inline: ['html-encoding-sniffer', '@exodus/bytes'],
    },
  },
});