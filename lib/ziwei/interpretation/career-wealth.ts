import { renderTemplate, resolveInterpretationRule } from '../rule-runtime'
import type { CalculatedChart, InterpretationSection } from '../types'

export function buildCareerWealthSection(chart: CalculatedChart): InterpretationSection {
  const rule = resolveInterpretationRule('careerWealth', chart)
  const template = renderTemplate(rule.templateId, chart)

  return {
    title: template.title,
    ruleIds: [rule.id],
    blocks: template.blocks ?? [],
  }
}
