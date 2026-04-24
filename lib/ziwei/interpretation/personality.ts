import { renderTemplate, resolveInterpretationRule } from '../rule-runtime'
import type { CalculatedChart, InterpretationSection } from '../types'

export function buildPersonalitySection(chart: CalculatedChart): InterpretationSection {
  const rule = resolveInterpretationRule('personality', chart)
  const template = renderTemplate(rule.templateId, chart)

  return {
    title: template.title,
    ruleIds: [rule.id],
    blocks: template.blocks ?? [],
  }
}
