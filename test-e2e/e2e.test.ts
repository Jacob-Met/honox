import { expect, test } from '@playwright/test'

test('test counter', async ({ page }) => {
  await page.goto('/interaction')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=first')
  await container.getByText('Count: 5').click()
  await container.locator('button').click()
  await container.getByText('Count: 6').click()
})

test('test named export', async ({ page }) => {
  await page.goto('/interaction')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=named')
  await container.getByText('Count: 30').click()
  await container.locator('button').click()
  await container.getByText('Count: 31').click()
})

test('test counter - island in the same directory', async ({ page }) => {
  await page.goto('/directory')
  await page.waitForSelector('body[data-client-loaded]')

  await page.getByText('UnderScoreCount: 5').click()
  await page.getByRole('button', { name: 'UnderScore Increment' }).click({
    clickCount: 1,
  })
  await page.getByText('UnderScoreCount: 6').click()

  await page.getByText('DollarCount: 5').click()
  await page.getByRole('button', { name: 'Dollar Increment' }).click({
    clickCount: 1,
  })
  await page.getByText('DollarCount: 6').click()
})

test('test counter - island in anywhere', async ({ page }) => {
  await page.goto('/interaction/anywhere')
  await page.waitForSelector('body[data-client-loaded]')

  await page.getByText('Count: 5').click()
  await page.getByRole('button', { name: 'Increment' }).click({
    clickCount: 1,
  })
  await page.getByText('Count: 6').click()
})

test('children - sync', async ({ page }) => {
  await page.goto('/interaction/children')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=sync')
  await container.locator('button').click()
  await container.getByText('Count: 1').click()
  const div = await container.locator('div')
  expect(await div.innerHTML()).toBe(
    '<h3 id="sync-header">Sync</h3><span data-content="Sync child">Sync child</span>'
  )
})

test('children - async', async ({ page }) => {
  await page.goto('/interaction/children')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=async')
  await container.locator('button').click()
  await container.getByText('Count: 3').click()
  await container.getByText('Async child').click()
})

test('children - nest', async ({ page }) => {
  await page.goto('/interaction/children')
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=nest')
  await container.locator('button').first().click()
  await container.getByText('Count: 11').click()

  const childContainer = page.locator('id=child')
  await childContainer.locator('button').click()
  await childContainer.getByText('Count: 13').click()
})

test('suspense', async ({ page }) => {
  await page.goto('/interaction/suspense', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=suspense')
  await container.locator('button').click()
  await container.getByText('Count: 5').click()
  await container.getByText('Suspense child').click()
})

test('suspense never resolved', async ({ page }) => {
  await page.goto('/interaction/suspense-never', { timeout: 1 }).catch(() => {}) // proceed test as soon as possible
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=suspense-never')
  await container.locator('button').click()
  await container.getByText('Count: 7').click()
  await container.getByText('Loading...').click()
})

test('error-boundary', async ({ page }) => {
  await page.goto('/interaction/error-boundary', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=error-boundary-success')
  await container.locator('button').click()
  await container.getByText('Count: 3').click()
  await container.getByText('Suspense child').click()
})

test('error-boundary failure', async ({ page }) => {
  await page.goto('/interaction/error-boundary', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('body[data-client-loaded]')
  const container = page.locator('id=error-boundary-failure')
  await container.locator('button').click()
  await container.getByText('Count: 5').click()
  const div = await container.locator('div')
  expect(await div.innerHTML()).toBe('<span class="error">Something went wrong</span>')
})

test('server-side suspense contains island components', async ({ page }) => {
  await page.goto('/interaction/suspense-islands', { timeout: 1 }).catch(() => {}) // proceed test as soon as possible
  await page.waitForSelector('body[data-client-loaded]')

  const container = page.locator('id=suspense-islands')
  await container.locator('button').click()
  await container.getByText('Count: 7').click()
  await container.getByText('Suspense Islands').click()
})

test('/app/nested', async ({ page }) => {
  await page.goto('/app/nested')
  const contentH1 = await page.textContent('h1')
  expect(contentH1).toBe('Nested')
})

test('island root is a real CSS direct child and hydrates without a wrapper', async ({ page }) => {
  await page.goto('/interaction/direct-child')
  await page.waitForSelector('body[data-client-loaded]')

  const input = page.locator('#direct-child-label > input')
  await expect(input).toHaveCount(1)
  await expect(page.locator('honox-island')).toHaveCount(0)
  await expect(input).toHaveCSS('border-top-width', '5px')
  await input.fill('hydrated')
  await expect(input).toHaveValue('hydrated')
})

test('hydrates islands inserted by an HTMX-style HTML swap without reloading the client', async ({
  page,
}) => {
  await page.goto('/interaction/anywhere')
  await page.waitForSelector('body[data-client-loaded]')
  const swapHtml = async () => {
    await page.evaluate(async () => {
      const response = await fetch('/interaction/anywhere')
      const html = await response.text()
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const target = document.createElement('section')
      target.id = 'htmx-target'
      target.innerHTML = parsed.body.innerHTML
      document.querySelector('#htmx-target')?.replaceWith(target)
      if (!target.isConnected) document.body.appendChild(target)
    })
  }

  await swapHtml()
  const target = page.locator('#htmx-target')
  await expect(target.getByText('Count: 5')).toBeVisible()
  await target.getByRole('button', { name: 'Increment' }).click()
  await expect(target.getByText('Count: 6')).toBeVisible()
  await target.getByRole('button', { name: 'Increment' }).click()
  await expect(target.getByText('Count: 7')).toBeVisible()

  // A second swap must hydrate a fresh island rather than reuse stale state.
  await swapHtml()
  await expect(target.getByText('Count: 5')).toBeVisible()
  await target.getByRole('button', { name: 'Increment' }).click()
  await expect(target.getByText('Count: 6')).toBeVisible()
})
