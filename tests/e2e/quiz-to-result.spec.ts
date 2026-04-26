import { test, expect } from '@playwright/test'

const sessionIdPattern = /^[a-z0-9-]{20,}$/i

test('quiz traffic can flow from quiz to chart and result', async ({ page }) => {
  await page.goto('/quiz')

  await expect(page.getByRole('heading', { name: '先做一个轻测试' })).toBeVisible()
  await page.getByRole('button', { name: '带着这份兴趣进入真实排盘' }).click()

  await expect(page).toHaveURL(/\/chart\?quizSessionId=/)

  const chartUrl = new URL(page.url())
  const quizSessionId = chartUrl.searchParams.get('quizSessionId')
  expect(quizSessionId).toMatch(sessionIdPattern)

  await expect(page.getByRole('heading', { name: '进入真实紫微排盘' })).toBeVisible()
  await expect(page.getByText('已承接轻测试偏好')).toBeVisible()

  await page.getByLabel('出生日期').fill('1995-08-18')
  await page.getByLabel('出生时间').fill('09:30')
  await page.getByLabel('出生地（市级）').selectOption('310100')
  await page.getByRole('button', { name: '进入真实命盘结果页' }).click()

  await expect(page).toHaveURL(/\/result\/[a-z0-9-]{20,}$/i)

  const resultUrl = new URL(page.url())
  const resultSessionId = resultUrl.pathname.split('/').at(-1)
  expect(resultSessionId).toMatch(sessionIdPattern)

  await expect(page.getByRole('heading', { name: '你的核心气质更偏向关系与自我理解的联动' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '这张盘先从关系映射线索读起' })).toBeVisible()
  await expect(page.getByRole('link', { name: '生成分享页' })).toHaveAttribute('href', `/share/${resultSessionId}`)
  await expect(page.getByRole('link', { name: '查看分享卡片数据' })).toHaveAttribute(
    'href',
    `/api/share-card/${resultSessionId}`,
  )
})
