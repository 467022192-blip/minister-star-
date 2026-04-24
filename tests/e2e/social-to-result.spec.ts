import { test, expect } from '@playwright/test'

test('social traffic can flow from landing to quiz, chart, result, and share', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: '先做一个轻测试' })).toBeVisible()
  await page.getByRole('link', { name: '先做一个轻测试' }).click()

  await expect(page.getByRole('heading', { name: '先做一个轻测试' })).toBeVisible()
  await page.getByRole('button', { name: '带着这份兴趣进入真实排盘' }).click()

  await expect(page).toHaveURL(/\/chart\?quizSessionId=/)
  await expect(page.getByText('已承接轻测试偏好')).toBeVisible()

  await page.getByLabel('出生日期').fill('1995-08-18')
  await page.getByLabel('出生时间').fill('09:30')
  await page.getByLabel('出生地（市级）').selectOption('310100')
  await page.getByRole('button', { name: '进入真实命盘结果页' }).click()

  await expect(page).toHaveURL(/\/result\//)
  await expect(page.getByRole('heading', { name: '你的核心气质更偏向关系与自我理解的联动' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '这张盘先从关系映射线索读起' })).toBeVisible()
  await expect(page.getByRole('link', { name: '生成分享页' })).toBeVisible()

  await page.getByRole('link', { name: '生成分享页' }).click()
  await expect(page).toHaveURL(/\/share\//)
  await expect(page.getByText('紫微结果分享')).toBeVisible()
  await expect(page.getByText('人格优先')).toBeVisible()
})
