import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import honox from '../src/vite'

export default defineConfig({
  plugins: [
    honox({
      entry: './app/server.ts',
      islandComponents: { islandDir: '/app/custom' },
    }),
    mdx({ jsxImportSource: 'hono/jsx' }),
  ],
})
