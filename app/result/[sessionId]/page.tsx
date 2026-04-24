import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { notFound } from 'next/navigation'
import { ChartStructureSummary } from '@/components/result/chart-structure-summary'
import { ResultSections } from '@/components/result/result-sections'
import { ResultSummary } from '@/components/result/result-summary'
import { getResultSessionById } from '@/lib/repositories/result-session-repo'

export default async function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await getResultSessionById(sessionId)

  if (!session || session.status !== 'computed' || !session.chartOutput || !session.interpretationOutput) {
    notFound()
  }
  const interpretation = session.interpretationOutput
  const chart = session.chartOutput

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-12 lg:px-10 lg:py-16">
        <PageViewTracker eventName="result_viewed" payload={{ sessionId }} />
        <ResultSummary sessionId={sessionId} title={interpretation.summary.title} tags={interpretation.summary.tags} />
        <ChartStructureSummary chart={chart} />
        <ResultSections sections={interpretation.sections} />
      </div>
    </main>
  )
}
