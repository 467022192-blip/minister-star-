export type CalendarType = 'solar' | 'lunar'
export type Gender = 'female' | 'male'
export type TimeMode = 'clock' | 'shichen'
export type TimeBranch = 'zi' | 'chou' | 'yin' | 'mao' | 'chen' | 'si' | 'wu' | 'wei' | 'shen' | 'you' | 'xu' | 'hai'

export type ChartInput = {
  calendarType: CalendarType
  birthDate: string
  birthTime: string
  gender: Gender
  birthCityCode: string
}

export type NormalizedBirthInput = ChartInput & {
  timezone: 'Asia/Shanghai'
  normalizedSolarDate: string
  timeBranch: TimeBranch
}

export type StructuredPalaceSummary = {
  palaceName: string
  label: string
  summary: string
  stars: string[]
}

export type ChartStructureSummary = {
  focusTone: string
  title: string
  overview: string
  lifePalaceLabel: string
  bodyPalaceLabel: string
  transformationLabel: string
  focusPalaces: StructuredPalaceSummary[]
  readingOrder: string[]
}

export type CalculatedChart = {
  ruleBasisId: string
  chartId: string
  inputContext?: Pick<NormalizedBirthInput, 'calendarType' | 'gender' | 'timeBranch' | 'birthCityCode' | 'normalizedSolarDate'>
  lifePalace: string
  bodyPalace: string
  primaryStars: string[]
  transformationSet: string[]
  palaces: Array<{
    palaceIndex: number
    palaceName: string
    stars: string[]
  }>
  structureSummary?: ChartStructureSummary
}

export type InterpretationSection = {
  title: string
  ruleIds: string[]
  blocks: string[]
}

export type ChartInterpretation = {
  summary: {
    title: string
    tags: string[]
  }
  sections: {
    personality: InterpretationSection
    relationship: InterpretationSection
    careerWealth: InterpretationSection
  }
}
