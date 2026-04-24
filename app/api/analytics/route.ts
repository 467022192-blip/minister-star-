import { NextResponse } from 'next/server'
import { getRequiredEventNames, type AnalyticsEventName } from '@/lib/analytics/events'
import { saveAnalyticsEvent } from '@/lib/repositories/analytics-repo'

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: AnalyticsEventName
    payload?: Record<string, unknown>
  }

  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (!getRequiredEventNames().includes(body.name)) {
    return NextResponse.json({ error: 'unsupported analytics event' }, { status: 400 })
  }

  const event = await saveAnalyticsEvent(body.name, body.payload ?? {})
  return NextResponse.json({ ok: true, event })
}
