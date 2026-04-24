import ruleBasisV1Json from './rules/basis-v1.json'

export const ruleBasisV1 = ruleBasisV1Json

export const standardBirthCases = [
  {
    id: 'case-1',
    birthDate: '1995-08-18',
    birthTime: '09:30',
    calendarType: 'solar',
    gender: 'female',
    birthCityCode: '310100',
    expectedChartSnapshot: {
      lifePalace: '迁移宫',
      bodyPalace: '命宫',
      primaryStars: ['紫微', '天相'],
      transformationSet: ['化禄'],
      focusTone: '关系映射',
      focusPalaces: ['迁移宫', '命宫', '官禄宫'],
      palaceStarMatrix: [{ palace: '迁移宫', stars: ['紫微', '天相'] }],
    },
  },
  {
    id: 'case-2',
    birthDate: '1988-02-03',
    birthTime: '亥时',
    calendarType: 'lunar',
    gender: 'male',
    birthCityCode: '440300',
    expectedChartSnapshot: {
      lifePalace: '夫妻宫',
      bodyPalace: '福德宫',
      primaryStars: ['太阴'],
      transformationSet: ['化科'],
      focusTone: '情感沉淀',
      focusPalaces: ['夫妻宫', '福德宫', '官禄宫'],
      palaceStarMatrix: [{ palace: '夫妻宫', stars: ['太阴'] }],
    },
  },
  {
    id: 'case-3',
    birthDate: '2001-11-27',
    birthTime: '13:00',
    calendarType: 'solar',
    gender: 'female',
    birthCityCode: '110100',
    expectedChartSnapshot: {
      lifePalace: '官禄宫',
      bodyPalace: '财帛宫',
      primaryStars: ['天府'],
      transformationSet: ['化权'],
      focusTone: '目标推进',
      focusPalaces: ['官禄宫', '财帛宫', '迁移宫'],
      palaceStarMatrix: [{ palace: '官禄宫', stars: ['天府'] }],
    },
  },
] as const
