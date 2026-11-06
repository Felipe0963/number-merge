import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // No GitHub Pages o site fica em /<repo>/; localmente continua em /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
