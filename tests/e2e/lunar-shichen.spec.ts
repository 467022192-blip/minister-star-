import { test, expect } from '@playwright/test'

test('chart flow supports lunar plus shichen input', async ({ page }) => {
  await page.goto('/chart')

  await expect(page.getByRole('heading', { name: '进入真实紫微排盘' })).toBeVisible()

  await page.getByLabel('历法').selectOption('lunar')
  await page.getByLabel('时间模式').selectOption('shichen')
  await page.getByLabel('出生日期').fill('1995-07-23')
  await page.getByLabel('出生时辰').selectOption('巳时')
  await page.getByLabel('出生地（市级）').selectOption('310100')

  await page.getByRole('button', { name: '进入真实命盘结果页' }).click()

  await expect(page).toHaveURL(/\/result\//)
  await expect(page.getByRole('heading', { name: '你的核心气质更偏向关系与自我理解的联动' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '人格与天赋' })).toBeVisible()
})
