'use client'

import { useEffect, useRef } from 'react'
import { emitAnalyticsEvent } from '@/lib/analytics/emit'
import type { AnalyticsEventName } from '@/lib/analytics/events'

type PageViewTrackerProps = {
  eventName: AnalyticsEventName
  payload?: Record<string, unknown>
}

export function PageViewTracker({ eventName, payload = {} }: PageViewTrackerProps) {
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (hasTrackedRef.current) {
      return
    }

    hasTrackedRef.current = true
    void emitAnalyticsEvent(eventName, payload)
  }, [eventName, payload])

  return null
}
