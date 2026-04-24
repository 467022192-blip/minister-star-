import type { AnalyticsEventName } from '@/lib/analytics/events'
import type { Prisma } from '@prisma/client'
import { getDb, getPersistenceMode } from '@/lib/db'

export type AnalyticsEventRecord = {
  id: string
  name: AnalyticsEventName
  payload: Record<string, unknown>
}

export const analyticsStore: AnalyticsEventRecord[] = []

export async function saveAnalyticsEvent(name: AnalyticsEventName, payload: Record<string, unknown>) {
  if (getPersistenceMode() === 'prisma') {
    const event = await getDb().analyticsEvent.create({
      data: {
        name,
        payload: payload as Prisma.InputJsonValue,
      },
    })

    return {
      id: event.id,
      name: event.name as AnalyticsEventName,
      payload: event.payload as Record<string, unknown>,
    }
  }

  const event = {
    id: `event-${analyticsStore.length + 1}`,
    name,
    payload,
  }

  analyticsStore.push(event)
  return event
}
