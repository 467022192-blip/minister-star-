'use server'

import { createDraftChartSession, markChartSessionFailed, saveComputedResult } from '@/lib/repositories/chart-session-repo'
import { chartInputSchema } from '@/lib/validation/chart'
import { calculateChart } from '@/lib/ziwei/calculate-chart'
import { interpretChart } from '@/lib/ziwei/interpretation'
import { normalizeBirthInput } from '@/lib/ziwei/normalize-birth-input'
import type { ChartInput } from '@/lib/ziwei/types'

export async function submitChartInput(input: ChartInput) {
  const parsed = chartInputSchema.parse(input)
  const session = await createDraftChartSession(parsed)

  try {
    const normalized = normalizeBirthInput(parsed)
    const chart = calculateChart(normalized)
    const interpretation = interpretChart(chart)
    await saveComputedResult({ sessionId: session.id, normalized, chart, interpretation })
    return { sessionId: session.id, status: 'computed' as const }
  } catch {
    await markChartSessionFailed({
      sessionId: session.id,
      errorCode: 'UNSUPPORTED_INPUT',
      failureReason: '当前输入暂不支持，请检查农历/时辰或重新选择出生城市',
    })

    return { sessionId: session.id, status: 'failed' as const }
  }
}
