export const requiredEventNames = [
  'landing_view',
  'quiz_started',
  'quiz_completed',
  'chart_started',
  'chart_completed',
  'result_viewed',
  'result_shared',
] as const

export type AnalyticsEventName = (typeof requiredEventNames)[number]

export function getRequiredEventNames() {
  return [...requiredEventNames]
}
