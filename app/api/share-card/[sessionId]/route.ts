import { NextResponse } from 'next/server'
import { getResultSessionById } from '@/lib/repositories/result-session-repo'

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params
  const session = await getResultSessionById(sessionId)

  if (!session || session.status !== 'computed' || !session.chartOutput || !session.interpretationOutput) {
    return new NextResponse('not found', { status: 404 })
  }

  return NextResponse.json({
    sessionId,
    type: 'share-card',
    source: 'persisted-computed-data',
    title: session.interpretationOutput.summary.title,
    tags: session.interpretationOutput.summary.tags,
    primaryPalace: session.chartOutput.lifePalace,
    bodyPalace: session.chartOutput.bodyPalace,
    primaryStars: session.chartOutput.primaryStars,
    focusTone: session.chartOutput.structureSummary?.focusTone ?? null,
    focusPalaces: session.chartOutput.structureSummary?.focusPalaces.map((palace) => palace.palaceName) ?? [],
    leadBlock: session.interpretationOutput.sections.personality.blocks[0] ?? '',
  })
}
