import { renderTemplate, resolveInterpretationRule } from '../rule-runtime'
import type { CalculatedChart, InterpretationSection } from '../types'

export function buildRelationshipSection(chart: CalculatedChart): InterpretationSection {
  const rule = resolveInterpretationRule('relationship', chart)
  const template = renderTemplate(rule.templateId, chart)

  return {
    title: template.title,
    ruleIds: [rule.id],
    blocks: template.blocks ?? [],
  }
}
