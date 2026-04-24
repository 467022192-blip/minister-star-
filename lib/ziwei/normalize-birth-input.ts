import { getMainlandCityByCode } from '@/lib/cities'
import type { ChartInput, NormalizedBirthInput, TimeBranch } from './types'

const shichenMap: Record<string, TimeBranch> = {
  子时: 'zi',
  丑时: 'chou',
  寅时: 'yin',
  卯时: 'mao',
  辰时: 'chen',
  巳时: 'si',
  午时: 'wu',
  未时: 'wei',
  申时: 'shen',
  酉时: 'you',
  戌时: 'xu',
  亥时: 'hai',
}

function inferTimeBranch(raw: string): TimeBranch {
  if (raw in shichenMap) {
    return shichenMap[raw]
  }

  const hour = Number(raw.split(':')[0])

  if (Number.isNaN(hour)) {
    throw new Error('unsupported birthTime')
  }

  if (hour >= 23 || hour < 1) return 'zi'
  if (hour < 3) return 'chou'
  if (hour < 5) return 'yin'
  if (hour < 7) return 'mao'
  if (hour < 9) return 'chen'
  if (hour < 11) return 'si'
  if (hour < 13) return 'wu'
  if (hour < 15) return 'wei'
  if (hour < 17) return 'shen'
  if (hour < 19) return 'you'
  if (hour < 21) return 'xu'
  return 'hai'
}

function normalizeLunarDate(input: ChartInput): string {
  if (input.calendarType === 'solar') {
    return input.birthDate
  }

  const [year, month, day] = input.birthDate.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error('invalid lunar birthDate')
  }

  const shiftedMonth = String(Math.min(month + 1, 12)).padStart(2, '0')
  const shiftedDay = String(Math.min(day + 1, 28)).padStart(2, '0')
  return `${year}-${shiftedMonth}-${shiftedDay}`
}

export function normalizeBirthInput(input: ChartInput): NormalizedBirthInput {
  const city = getMainlandCityByCode(input.birthCityCode)

  if (!city) {
    throw new Error('birthCityCode must be a supported mainland city')
  }

  return {
    ...input,
    timezone: 'Asia/Shanghai',
    normalizedSolarDate: normalizeLunarDate(input),
    timeBranch: inferTimeBranch(input.birthTime),
  }
}
