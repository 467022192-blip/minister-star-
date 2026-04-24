import { getChartSessionById } from './chart-session-repo'

export async function getResultSessionById(sessionId: string) {
  return getChartSessionById(sessionId)
}
