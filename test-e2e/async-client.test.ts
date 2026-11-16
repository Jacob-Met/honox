import { expect, test } from '@playwright/test'

test('async island fetch runs in the browser and hydrates after Suspense', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
  // Vite may reload the document once as it optimizes new dependencies.
  // Count calls per document; a reload is a separate, legitimate client mount.
  await page.addInitScript(() => {
    let calls = 0
    const nativeFetch = window.fetch.bind(window)
    Object.defineProperty(window, '__honoxAsyncFetchCount', { get: () => calls })
    window.fetch = (...args) => {
      if (String(args[0]).includes('/api/async-widget')) calls++
      return nativeFetch(...args)
    }
  })
  const countCurrentDocumentFetches = () =>
    page.evaluate(() => Number(Reflect.get(window, '__honoxAsyncFetchCount')))
  let releaseResponse: () => void = () => {}
  const responseGate = new Promise<void>((resolve) => (releaseResponse = resolve))

  await page.route('**/api/async-widget?slot=*', async (route) => {
    await responseGate
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'browser' }),
    })
  })

  const response = await page.goto('/interaction/async-client', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  // No server-side URL parsing error or leaked browser-dependent result in initial HTML.
  expect(await response?.text()).not.toContain('Loaded in browser')
  await page.waitForSelector('body[data-client-loaded]', { state: 'attached' })
  await expect(page.locator('[data-honox-async-loading]')).toHaveCount(1)
  await expect.poll(countCurrentDocumentFetches).toBe(1)

  releaseResponse()
  await expect(page.locator('#async-result')).toHaveText('Loaded in browser')
  await expect(page.locator('[data-honox-async-loading]')).toHaveCount(0)
  await expect.poll(countCurrentDocumentFetches).toBe(1)
  expect(pageErrors).toEqual([])
})

test('independent async islands hydrate while a sibling request is blocked', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const counts = { slow: 0, fast: 0 }
  let releaseSlow: () => void = () => {}
  const slowGate = new Promise<void>((resolve) => (releaseSlow = resolve))
  await page.route('**/api/async-widget?slot=*', async (route) => {
    const slot = new URL(route.request().url()).searchParams.get('slot') as 'slow' | 'fast'
    counts[slot]++
    if (slot === 'slow') await slowGate
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: slot }),
    })
  })
  await page.goto('/interaction/async-siblings', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  await expect(page.locator('#async-result-fast')).toHaveText('Loaded in fast')
  await expect(page.locator('#async-result-slow')).toHaveCount(0)
  releaseSlow()
  await expect(page.locator('#async-result-slow')).toHaveText('Loaded in slow')
  expect(counts).toEqual({ slow: 1, fast: 1 })
  expect(pageErrors).toEqual([])
})
