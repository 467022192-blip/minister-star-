'use client'

import Link from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'
import { emitAnalyticsEvent } from '@/lib/analytics/emit'
import type { AnalyticsEventName } from '@/lib/analytics/events'

type TrackedLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  eventName: AnalyticsEventName
  eventPayload?: Record<string, unknown>
}

export function TrackedLink({ eventName, eventPayload = {}, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) {
          void emitAnalyticsEvent(eventName, eventPayload)
        }
      }}
    />
  )
}
