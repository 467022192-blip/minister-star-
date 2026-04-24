import { describe, expect, it } from 'vitest'
import { standardBirthCases } from '../../../lib/ziwei/rule-basis'
import { normalizeBirthInput } from '../../../lib/ziwei/normalize-birth-input'
import { calculateChart } from '../../../lib/ziwei/calculate-chart'

describe('calculateChart', () => {
  it('matches all frozen expected snapshot fields', () => {
    for (const birthCase of standardBirthCases) {
      const chart = calculateChart(normalizeBirthInput(birthCase))
      expect(chart.ruleBasisId).toBe('ziwei-rule-basis-v1')
      expect(chart.lifePalace).toBe(birthCase.expectedChartSnapshot.lifePalace)
      expect(chart.bodyPalace).toBe(birthCase.expectedChartSnapshot.bodyPalace)
      expect(chart.primaryStars).toEqual(birthCase.expectedChartSnapshot.primaryStars)
      expect(chart.transformationSet).toEqual(birthCase.expectedChartSnapshot.transformationSet)
      expect(chart.structureSummary?.focusTone).toBe(birthCase.expectedChartSnapshot.focusTone)
      expect(chart.structureSummary?.readingOrder).toEqual(birthCase.expectedChartSnapshot.focusPalaces)
    }
  })
})
