import { describe, expect, it } from 'vitest'
import ruleBasisV1Json from '../../../lib/ziwei/rules/basis-v1.json'
import { ruleBasisV1, standardBirthCases } from '../../../lib/ziwei/rule-basis'

describe('ziwei-rule-basis-v1', () => {
  it('is frozen as the only MVP ruleset', () => {
    expect(ruleBasisV1.id).toBe('ziwei-rule-basis-v1')
    expect(ruleBasisV1.version).toBe('v1')
    expect(ruleBasisV1.multiSchoolCompatible).toBe(false)
  })

  it('contains real expected fixture outputs with no placeholders', () => {
    expect(standardBirthCases.length).toBeGreaterThanOrEqual(3)
    expect(JSON.stringify(standardBirthCases)).not.toContain('REPLACE_WITH_REAL_VALUE')
  })

  it('keeps json as the single source of truth', () => {
    expect(ruleBasisV1).toEqual(ruleBasisV1Json)
  })
})
