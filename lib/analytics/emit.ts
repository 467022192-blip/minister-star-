import type { AnalyticsEventName } from './events'

export async function emitAnalyticsEvent(name: AnalyticsEventName, payload: Record<string, unknown>) {
  await fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, payload }),
  })
}
