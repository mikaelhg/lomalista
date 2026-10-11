import { withRsbuildConfig } from '@rstest/adapter-rsbuild';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  extends: withRsbuildConfig(),
  testEnvironment: 'happy-dom',
  setupFiles: ['./src/tests/setup.ts'],
  include: ['src/**/*.test.{ts,tsx}'],
});
