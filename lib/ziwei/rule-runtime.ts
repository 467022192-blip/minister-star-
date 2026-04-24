import { ruleBasisV1 } from './rule-basis'
import type { CalculatedChart, ChartInterpretation } from './types'

type RuleCondition = {
  field: string
  operator: string
  value: string | string[]
}

type ChartRule = (typeof ruleBasisV1.chartRules)[number]
type InterpretationRule = (typeof ruleBasisV1.interpretationRules)[number]
type Topic = keyof ChartInterpretation['sections'] | 'summary'

export function resolveChartOutputs(context: Record<string, unknown>) {
  const outputs: Record<string, unknown> = {}
  const outputKeys = [...new Set(ruleBasisV1.chartRules.map((rule) => rule.outputKey))]

  for (const outputKey of outputKeys) {
    const matchedRules = ruleBasisV1.chartRules.filter((rule) => rule.outputKey === outputKey && matchesConditions(context, rule.triggerConditions))

    if (!matchedRules.length) {
      continue
    }

    const priorityWinner = [...matchedRules].sort((left, right) => right.priority - left.priority)[0]
    const firstMatch = matchedRules[0]
    const selectedRule = (priorityWinner.conflictPolicy ?? 'highest_priority_wins') === 'first_match' ? firstMatch : priorityWinner

    outputs[outputKey] = selectedRule.outputValue
  }

  return outputs
}

export function resolveInterpretationRule(topic: Topic, chart: CalculatedChart) {
  const context = buildRuleContext(chart)
  const matchedRules = ruleBasisV1.interpretationRules.filter((rule) => rule.topic === topic && matchesConditions(context, rule.triggerConditions))

  if (!matchedRules.length) {
    throw new Error(`no interpretation rule matched topic ${topic}`)
  }

  return [...matchedRules].sort((left, right) => right.priority - left.priority)[0]
}

export function renderTemplate(templateId: string, chart: CalculatedChart) {
  const template = ruleBasisV1.templateCatalog[templateId as keyof typeof ruleBasisV1.templateCatalog]

  if (!template) {
    throw new Error(`template not found: ${templateId}`)
  }

  return {
    title: renderInterpolatedText(template.title, chart),
    tags: 'tags' in template && Array.isArray(template.tags) ? template.tags.map((tag) => renderInterpolatedText(tag, chart)) : undefined,
    blocks: 'blocks' in template && Array.isArray(template.blocks) ? template.blocks.map((block) => renderInterpolatedText(block, chart)) : undefined,
  }
}

function buildRuleContext(chart: CalculatedChart) {
  return {
    ...chart.inputContext,
    lifePalace: chart.lifePalace,
    bodyPalace: chart.bodyPalace,
    primaryStars: chart.primaryStars,
    transformationSet: chart.transformationSet,
  }
}

function matchesConditions(context: Record<string, unknown>, conditions: readonly RuleCondition[]) {
  return conditions.every((condition) => matchesCondition(context, condition))
}

function matchesCondition(context: Record<string, unknown>, condition: RuleCondition) {
  const contextValue = context[condition.field]

  if (condition.operator === 'equals') {
    if (Array.isArray(contextValue)) {
      return contextValue.includes(condition.value)
    }

    return contextValue === condition.value
  }

  if (condition.operator !== 'includes') {
    throw new Error(`unsupported rule operator: ${condition.operator}`)
  }

  const expectedValues = Array.isArray(condition.value) ? condition.value : [condition.value]

  if (Array.isArray(contextValue)) {
    return expectedValues.some((value) => contextValue.includes(value))
  }

  return expectedValues.includes(String(contextValue))
}

function renderInterpolatedText(template: string, chart: CalculatedChart) {
  const valueMap = {
    lifePalace: chart.lifePalace,
    bodyPalace: chart.bodyPalace,
    primaryStars: chart.primaryStars.join(' / '),
    transformationSet: chart.transformationSet.join(' / '),
    calendarType: chart.inputContext?.calendarType ?? '',
    gender: chart.inputContext?.gender ?? '',
    timeBranch: chart.inputContext?.timeBranch ?? '',
    birthCityCode: chart.inputContext?.birthCityCode ?? '',
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => valueMap[key.trim() as keyof typeof valueMap] ?? '')
}
