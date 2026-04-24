import { ruleBasisV1 } from './rule-basis'
import { resolveChartOutputs } from './rule-runtime'
import type { CalculatedChart, NormalizedBirthInput } from './types'

const palaceNames = [...ruleBasisV1.palaceSequence]
const bodySupportStars = {
  命宫: '左辅',
  福德宫: '天喜',
  财帛宫: '天魁',
} as const

export function calculateChart(input: NormalizedBirthInput): CalculatedChart {
  const outputs = resolveChartOutputs({
    calendarType: input.calendarType,
    gender: input.gender,
    timeBranch: input.timeBranch,
  })

  const lifePalace = readStringOutput(outputs.lifePalace, 'lifePalace')
  const bodyPalace = readStringOutput(outputs.bodyPalace, 'bodyPalace')
  const primaryStars = readStringArrayOutput(outputs.primaryStars, 'primaryStars')
  const transformationSet = readStringArrayOutput(outputs.transformationSet, 'transformationSet')
  const focusTone = readStringOutput(outputs.focusTone, 'focusTone')
  const readingOrder = readStringArrayOutput(outputs.focusPalaces, 'focusPalaces')
  const transformationSupportStar = ruleBasisV1.transformationSupportStars[transformationSet[0] as keyof typeof ruleBasisV1.transformationSupportStars]
  const bodySupportStar = bodySupportStars[bodyPalace as keyof typeof bodySupportStars]

  const palaces = palaceNames.map((palaceName, index) => {
    const stars = [
      ...(palaceName === lifePalace ? primaryStars : []),
      ...(palaceName === bodyPalace && bodySupportStar ? [bodySupportStar] : []),
      ...(palaceName === '官禄宫' && transformationSupportStar ? [transformationSupportStar] : []),
    ]

    return {
      palaceIndex: index + 1,
      palaceName,
      stars: [...stars],
    }
  })

  const structureSummary = buildStructureSummary({
    lifePalace,
    bodyPalace,
    primaryStars,
    transformationSet,
    focusTone,
    readingOrder,
    palaces,
  })

  return {
    ruleBasisId: ruleBasisV1.id,
    chartId: `${input.birthCityCode}-${input.birthDate}-${input.birthTime}`,
    inputContext: {
      calendarType: input.calendarType,
      gender: input.gender,
      timeBranch: input.timeBranch,
      birthCityCode: input.birthCityCode,
      normalizedSolarDate: input.normalizedSolarDate,
    },
    lifePalace,
    bodyPalace,
    primaryStars: [...primaryStars],
    transformationSet: [...transformationSet],
    palaces,
    structureSummary,
  }
}

function readStringOutput(value: unknown, outputKey: string) {
  if (typeof value !== 'string') {
    throw new Error(`missing chart output for ${outputKey}`)
  }

  return value
}

function readStringArrayOutput(value: unknown, outputKey: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`missing chart output for ${outputKey}`)
  }

  return value
}

function buildStructureSummary(payload: {
  lifePalace: string
  bodyPalace: string
  primaryStars: string[]
  transformationSet: string[]
  focusTone: string
  readingOrder: string[]
  palaces: CalculatedChart['palaces']
}) {
  const palaceCatalog = ruleBasisV1.palaceDescriptorCatalog
  const transformationCatalog = ruleBasisV1.transformationDescriptorCatalog
  const firstTransformation = payload.transformationSet[0]
  const lifeDescriptor = palaceCatalog[payload.lifePalace as keyof typeof palaceCatalog]
  const bodyDescriptor = palaceCatalog[payload.bodyPalace as keyof typeof palaceCatalog]
  const transformationDescriptor = transformationCatalog[firstTransformation as keyof typeof transformationCatalog]

  return {
    focusTone: payload.focusTone,
    title: `这张盘先从${payload.focusTone}线索读起`,
    overview: `${payload.lifePalace}作为命宫，主轴更偏向${lifeDescriptor.summary}；${payload.bodyPalace}作为身宫，行动上会投向${bodyDescriptor.summary}。当前主星 ${payload.primaryStars.join(' / ')} 与 ${firstTransformation}${transformationDescriptor.summary}，说明你更适合沿着这条结构来理解自己。`,
    lifePalaceLabel: lifeDescriptor.label,
    bodyPalaceLabel: bodyDescriptor.label,
    transformationLabel: transformationDescriptor.label,
    focusPalaces: payload.readingOrder.map((palaceName) => {
      const descriptor = palaceCatalog[palaceName as keyof typeof palaceCatalog]
      const palace = payload.palaces.find((item) => item.palaceName === palaceName)

      return {
        palaceName,
        label: descriptor.label,
        summary: descriptor.summary,
        stars: palace?.stars ?? [],
      }
    }),
    readingOrder: [...payload.readingOrder],
  }
}
