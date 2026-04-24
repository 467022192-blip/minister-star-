import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

loadDotEnv(resolve(rootDir, '.env'))

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to seed Prisma sample data')
}

const prisma = new PrismaClient()

const sampleSession = {
  id: 'prisma-computed-session',
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
    chartId: 'prisma-computed-session',
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

await prisma.chartSession.upsert({
  where: { id: sampleSession.id },
  update: {
    status: sampleSession.status,
    rawInput: sampleSession.rawInput,
    normalizedInput: sampleSession.normalizedInput,
    chartOutput: sampleSession.chartOutput,
    interpretationOutput: sampleSession.interpretationOutput,
    errorCode: null,
    failureReason: null,
  },
  create: sampleSession,
})

console.log(`seeded chart session: ${sampleSession.id}`)
await prisma.$disconnect()

function loadDotEnv(dotEnvPath) {
  if (!existsSync(dotEnvPath)) {
    return
  }

  const envFile = readFileSync(dotEnvPath, 'utf8')

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
