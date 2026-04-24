import { z } from 'zod'
import { isSupportedMainlandCityCode } from '@/lib/cities'

export const chartInputSchema = z.object({
  birthDate: z.string().trim().min(1, 'birthDate is required'),
  birthTime: z.string().trim().min(1, 'birthTime is required'),
  calendarType: z.enum(['solar', 'lunar']),
  gender: z.enum(['female', 'male']),
  birthCityCode: z
    .string()
    .trim()
    .min(1, 'birthCityCode is required')
    .refine(isSupportedMainlandCityCode, 'birthCityCode must be a supported mainland city'),
})
