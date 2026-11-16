import { expect, test } from '@playwright/test'

test('custom island directory hydrates without supplying ISLAND_FILES', async ({ page }) => {
  await page.goto('http://localhost:6174/custom')
  await page.waitForSelector('body[data-client-loaded]')
  await expect(page.getByText('Custom count: 1')).toBeVisible()
  await page.getByRole('button', { name: 'Increment custom' }).click()
  await expect(page.getByText('Custom count: 2')).toBeVisible()
})
