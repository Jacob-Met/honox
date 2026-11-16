// The distributed package is imported by Cloudflare Vitest and Node unit tests
// without Vite's import.meta.glob compilation. Exercise that real entry point.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApp } from '../dist/server/index.js'

test('createApp without Vite returns a working 404 instead of throwing', async () => {
  const warnings = []
  const previousWarn = console.warn
  console.warn = (message) => warnings.push(message)
  try {
    const app = createApp()
    const response = await app.request('/missing')
    assert.equal(response.status, 404)
    assert.equal(await response.text(), '404 Not Found')
    assert.match(warnings.join(' '), /import.meta.glob is unavailable/)
    assert.match(warnings.join(' '), /file-based routes are not loaded/)
    const anotherApp = createApp()
    assert.equal((await anotherApp.request('/missing')).status, 404)
    assert.equal(warnings.length, 1)
  } finally {
    console.warn = previousWarn
  }
})

test('createApp with explicit file maps works without Vite', async () => {
  const app = createApp({
    root: '/app/routes',
    ROUTES: {
      '/app/routes/index.tsx': {
        default: (c) => c.text('Unit-tested worker'),
      },
    },
    RENDERER: {},
    MIDDLEWARE: {},
    ERROR: {},
    NOT_FOUND: {},
  })
  const response = await app.request('/')
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'Unit-tested worker')
})
