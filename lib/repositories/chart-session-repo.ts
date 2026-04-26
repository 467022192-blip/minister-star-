import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { isSupportedMainlandCityCode } from '@/lib/cities'
import { getDb, getPersistenceMode } from '@/lib/db'
import { getPrivateJson, putPrivateJson } from '@/lib/blob/session-store'
import type { ChartInput, ChartInterpretation, CalculatedChart, NormalizedBirthInput } from '@/lib/ziwei/types'

export type ChartSessionRecord = {
  id: string
  status: 'draft' | 'computed' | 'failed'
  rawInput: ChartInput
  normalizedInput?: NormalizedBirthInput
  chartOutput?: CalculatedChart
  interpretationOutput?: ChartInterpretation
  errorCode?: string
  failureReason?: string
}

const seededComputedSession: ChartSessionRecord = {
  id: 'computed-session',
  status: 'computed',
  rawInput: {
    birthDate: '1995-08-18',
    birthTime: '09:30',
    calendarType: 'solar',
    gender: 'female',
    birthCityCode: '310100',
  },
  normalizedInput: {
    birthDate: '1995-08-18',
    birthTime: '09:30',
    calendarType: 'solar',
    gender: 'female',
    birthCityCode: '310100',
    timezone: 'Asia/Shanghai',
    normalizedSolarDate: '1995-08-18',
    timeBranch: 'si',
  },
  chartOutput: {
    ruleBasisId: 'ziwei-rule-basis-v1',
    chartId: 'computed-session',
    inputContext: {
      calendarType: 'solar',
      gender: 'female',
      timeBranch: 'si',
      birthCityCode: '310100',
      normalizedSolarDate: '1995-08-18',
    },
    lifePalace: '迁移宫',
    bodyPalace: '命宫',
    primaryStars: ['紫微', '天相'],
    transformationSet: ['化禄'],
    palaces: [
      { palaceIndex: 1, palaceName: '命宫', stars: ['左辅'] },
      { palaceIndex: 2, palaceName: '兄弟宫', stars: [] },
      { palaceIndex: 3, palaceName: '夫妻宫', stars: [] },
      { palaceIndex: 4, palaceName: '子女宫', stars: [] },
      { palaceIndex: 5, palaceName: '财帛宫', stars: [] },
      { palaceIndex: 6, palaceName: '疾厄宫', stars: [] },
      { palaceIndex: 7, palaceName: '迁移宫', stars: ['紫微', '天相'] },
      { palaceIndex: 8, palaceName: '仆役宫', stars: [] },
      { palaceIndex: 9, palaceName: '官禄宫', stars: ['禄存'] },
      { palaceIndex: 10, palaceName: '田宅宫', stars: [] },
      { palaceIndex: 11, palaceName: '福德宫', stars: [] },
      { palaceIndex: 12, palaceName: '父母宫', stars: [] },
    ],
    structureSummary: {
      focusTone: '关系映射',
      title: '这张盘先从关系映射线索读起',
      overview:
        '迁移宫作为命宫，主轴更偏向先通过环境变化、他人目光与位置转换来确认方向；命宫作为身宫，行动上会投向先回到自我定位、表达方式与人格底色。当前主星 紫微 / 天相 与 化禄更容易通过关系、机会与可承接的接口靠近你，说明你更适合沿着这条结构来理解自己。',
      lifePalaceLabel: '外部场域',
      bodyPalaceLabel: '自我定盘',
      transformationLabel: '资源流入',
      focusPalaces: [
        {
          palaceName: '迁移宫',
          label: '外部场域',
          summary: '先通过环境变化、他人目光与位置转换来确认方向',
          stars: ['紫微', '天相'],
        },
        {
          palaceName: '命宫',
          label: '自我定盘',
          summary: '先回到自我定位、表达方式与人格底色',
          stars: ['左辅'],
        },
        {
          palaceName: '官禄宫',
          label: '目标推进',
          summary: '先围绕目标、职责与职业进阶去组织行动',
          stars: ['禄存'],
        },
      ],
      readingOrder: ['迁移宫', '命宫', '官禄宫'],
    },
  },
  interpretationOutput: {
    summary: {
      title: '你的核心气质更偏向关系与自我理解的联动',
      tags: ['人格优先', '关系承接', '真实排盘入口'],
    },
    sections: {
      personality: {
        title: '人格与天赋',
        ruleIds: ['persisted-personality'],
        blocks: ['这里展示已持久化的人格模块。'],
      },
      relationship: {
        title: '感情模式',
        ruleIds: ['persisted-relationship'],
        blocks: ['这里展示已持久化的关系模块。'],
      },
      careerWealth: {
        title: '事业与财运',
        ruleIds: ['persisted-career'],
        blocks: ['这里展示已持久化的事业财运模块。'],
      },
    },
  },
}

const seededFailedSession: ChartSessionRecord = {
  id: 'failed-session',
  status: 'failed',
  rawInput: {
    birthDate: '1995-07-23',
    birthTime: 'invalid-time',
    calendarType: 'lunar',
    gender: 'female',
    birthCityCode: '310100',
  },
  errorCode: 'UNSUPPORTED_INPUT',
  failureReason: 'unsupported input',
}

export const chartSessionStore = new Map<string, ChartSessionRecord>([
  [seededComputedSession.id, seededComputedSession],
  [seededFailedSession.id, seededFailedSession],
])

function mapChartSessionRecord(record: {
  id: string
  status: string
  rawInput: unknown
  normalizedInput: unknown
  chartOutput: unknown
  interpretationOutput: unknown
  errorCode: string | null
  failureReason: string | null
}): ChartSessionRecord {
  return {
    id: record.id,
    status: record.status as ChartSessionRecord['status'],
    rawInput: record.rawInput as ChartInput,
    normalizedInput: (record.normalizedInput ?? undefined) as NormalizedBirthInput | undefined,
    chartOutput: (record.chartOutput ?? undefined) as CalculatedChart | undefined,
    interpretationOutput: (record.interpretationOutput ?? undefined) as ChartInterpretation | undefined,
    errorCode: record.errorCode ?? undefined,
    failureReason: record.failureReason ?? undefined,
  }
}

export async function getChartSessionById(sessionId: string) {
  if (getPersistenceMode() === 'blob') {
    const record = await getPrivateJson(`chart-sessions/${sessionId}.json`)
    return isChartSessionRecord(record) ? record : null
  }

  if (getPersistenceMode() === 'memory') {
    return chartSessionStore.get(sessionId) ?? null
  }

  const session = await getDb().chartSession.findUnique({ where: { id: sessionId } })
  return session ? mapChartSessionRecord(session) : null
}

export async function createDraftChartSession(input: ChartInput) {
  if (!input.birthCityCode) {
    throw new Error('birthCityCode is required')
  }

  if (!isSupportedMainlandCityCode(input.birthCityCode)) {
    throw new Error('birthCityCode must be a supported mainland city')
  }

  if (getPersistenceMode() === 'blob') {
    const id = randomUUID()
    const record: ChartSessionRecord = {
      id,
      status: 'draft',
      rawInput: input,
    }

    await putPrivateJson(`chart-sessions/${id}.json`, record)
    return record
  }

  if (getPersistenceMode() === 'prisma') {
    const session = await getDb().chartSession.create({
      data: {
        status: 'draft',
        rawInput: input as Prisma.InputJsonValue,
      },
    })

    return mapChartSessionRecord(session)
  }

  const id = randomUUID()
  const record: ChartSessionRecord = {
    id,
    status: 'draft',
    rawInput: input,
  }

  chartSessionStore.set(id, record)
  return record
}

export async function saveComputedResult(payload: {
  sessionId: string
  normalized: NormalizedBirthInput
  chart: CalculatedChart
  interpretation: ChartInterpretation
}) {
  if (getPersistenceMode() === 'blob') {
    const record = await getPrivateJson(`chart-sessions/${payload.sessionId}.json`)

    if (!isChartSessionRecord(record)) {
      throw new Error('session not found')
    }

    const updated: ChartSessionRecord = {
      ...record,
      status: 'computed',
      normalizedInput: payload.normalized,
      chartOutput: payload.chart,
      interpretationOutput: payload.interpretation,
      errorCode: undefined,
      failureReason: undefined,
    }

    await putPrivateJson(`chart-sessions/${payload.sessionId}.json`, updated, { allowOverwrite: true })
    return updated
  }

  if (getPersistenceMode() === 'prisma') {
    const session = await getDb().chartSession.update({
      where: { id: payload.sessionId },
      data: {
        status: 'computed',
        normalizedInput: payload.normalized as Prisma.InputJsonValue,
        chartOutput: payload.chart as Prisma.InputJsonValue,
        interpretationOutput: payload.interpretation as Prisma.InputJsonValue,
        errorCode: null,
        failureReason: null,
      },
    })

    return mapChartSessionRecord(session)
  }

  const session = chartSessionStore.get(payload.sessionId)

  if (!session) {
    throw new Error('session not found')
  }

  const updated: ChartSessionRecord = {
    ...session,
    status: 'computed',
    normalizedInput: payload.normalized,
    chartOutput: payload.chart,
    interpretationOutput: payload.interpretation,
    errorCode: undefined,
    failureReason: undefined,
  }

  chartSessionStore.set(payload.sessionId, updated)
  return updated
}

export async function markChartSessionFailed(payload: {
  sessionId: string
  errorCode: string
  failureReason: string
}) {
  if (getPersistenceMode() === 'blob') {
    const record = await getPrivateJson(`chart-sessions/${payload.sessionId}.json`)

    if (!isChartSessionRecord(record)) {
      throw new Error('session not found')
    }

    const updated: ChartSessionRecord = {
      ...record,
      status: 'failed',
      errorCode: payload.errorCode,
      failureReason: payload.failureReason,
    }

    await putPrivateJson(`chart-sessions/${payload.sessionId}.json`, updated, { allowOverwrite: true })
    return updated
  }

  if (getPersistenceMode() === 'prisma') {
    const session = await getDb().chartSession.update({
      where: { id: payload.sessionId },
      data: {
        status: 'failed',
        errorCode: payload.errorCode,
        failureReason: payload.failureReason,
      },
    })

    return mapChartSessionRecord(session)
  }

  const session = chartSessionStore.get(payload.sessionId)

  if (!session) {
    throw new Error('session not found')
  }

  const updated: ChartSessionRecord = {
    ...session,
    status: 'failed',
    errorCode: payload.errorCode,
    failureReason: payload.failureReason,
  }

  chartSessionStore.set(payload.sessionId, updated)
  return updated
}

function isChartInput(value: unknown): value is ChartInput {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.birthDate === 'string' &&
    typeof record.birthTime === 'string' &&
    (record.calendarType === 'solar' || record.calendarType === 'lunar') &&
    (record.gender === 'female' || record.gender === 'male') &&
    typeof record.birthCityCode === 'string'
  )
}

function isChartOutputForShareCard(value: unknown): value is CalculatedChart {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  if (
    typeof record.ruleBasisId !== 'string' ||
    typeof record.chartId !== 'string' ||
    typeof record.lifePalace !== 'string' ||
    typeof record.bodyPalace !== 'string' ||
    !Array.isArray(record.primaryStars)
  ) {
    return false
  }

  if (record.structureSummary == null) {
    return true
  }

  if (typeof record.structureSummary !== 'object') {
    return false
  }

  const summary = record.structureSummary as Record<string, unknown>

  return (
    typeof summary.focusTone === 'string' &&
    Array.isArray(summary.focusPalaces) &&
    summary.focusPalaces.every((palace) => {
      if (!palace || typeof palace !== 'object') {
        return false
      }

      return typeof (palace as Record<string, unknown>).palaceName === 'string'
    })
  )
}

function isInterpretationOutputForResult(value: unknown): value is ChartInterpretation {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  if (typeof record.summary !== 'object' || !record.summary) {
    return false
  }

  const summary = record.summary as Record<string, unknown>
  if (typeof summary.title !== 'string' || !Array.isArray(summary.tags)) {
    return false
  }

  if (typeof record.sections !== 'object' || !record.sections) {
    return false
  }

  const sections = record.sections as Record<string, unknown>
  const personality = sections.personality as Record<string, unknown> | undefined
  const relationship = sections.relationship as Record<string, unknown> | undefined
  const careerWealth = sections.careerWealth as Record<string, unknown> | undefined

  if (!personality || !relationship || !careerWealth) {
    return false
  }

  return (
    Array.isArray(personality.blocks) &&
    Array.isArray(relationship.blocks) &&
    Array.isArray(careerWealth.blocks)
  )
}

function isChartSessionRecord(value: unknown): value is ChartSessionRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>

  if (typeof record.id !== 'string' || !isChartInput(record.rawInput)) {
    return false
  }

  if (record.status === 'draft') {
    return true
  }

  if (record.status === 'failed') {
    return typeof record.errorCode === 'string' && typeof record.failureReason === 'string'
  }

  if (record.status === 'computed') {
    return isChartOutputForShareCard(record.chartOutput) && isInterpretationOutputForResult(record.interpretationOutput)
  }

  return false
}
