import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.jsx',
    },
  },
  output: {
    distPath: {
      root: 'dist',
    },
    assetPrefix: '/',
  },
  dev: {
    assetPrefix: '/',
  },
  server: {
    port: 3000,
    host: 'localhost',
  },
});
