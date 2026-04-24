import { buildCareerWealthSection } from './career-wealth'
import { buildPersonalitySection } from './personality'
import { buildRelationshipSection } from './relationship'
import { renderTemplate, resolveInterpretationRule } from '../rule-runtime'
import type { CalculatedChart, ChartInterpretation } from '../types'

export function interpretChart(chart: CalculatedChart): ChartInterpretation {
  const personality = buildPersonalitySection(chart)
  const relationship = buildRelationshipSection(chart)
  const careerWealth = buildCareerWealthSection(chart)
  const summaryRule = resolveInterpretationRule('summary', chart)
  const summaryTemplate = renderTemplate(summaryRule.templateId, chart)

  return {
    summary: {
      title: summaryTemplate.title,
      tags: summaryTemplate.tags ?? ['人格优先', '关系承接', '真实排盘入口'],
    },
    sections: {
      personality,
      relationship,
      careerWealth,
    },
  }
}
