import { describe, expect, it } from 'vitest'
import { ruleBasisV1, standardBirthCases } from '../../../lib/ziwei/rule-basis'
import { normalizeBirthInput } from '../../../lib/ziwei/normalize-birth-input'
import { calculateChart } from '../../../lib/ziwei/calculate-chart'
import { interpretChart } from '../../../lib/ziwei/interpretation'

describe('interpretChart', () => {
  it('returns rule-driven sections tied to frozen basis-v1 rule ids across fixtures', () => {
    const outputs = standardBirthCases.map((birthCase) => interpretChart(calculateChart(normalizeBirthInput(birthCase))))
    const allowedRuleIds = new Set(ruleBasisV1.interpretationRules.map((rule) => rule.id))

    for (const interpretation of outputs) {
      expect(interpretation.summary.title).toBeTruthy()

      for (const section of Object.values(interpretation.sections)) {
        expect(section.ruleIds.length).toBeGreaterThan(0)
        for (const ruleId of section.ruleIds) {
          expect(allowedRuleIds.has(ruleId) || ruleId.startsWith('persisted')).toBe(true)
        }
      }
    }
  })
})
