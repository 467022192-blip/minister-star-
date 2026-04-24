import { notFound } from 'next/navigation'
import { ShareCard } from '@/components/share/share-card'
import { getResultSessionById } from '@/lib/repositories/result-session-repo'

export default async function SharePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await getResultSessionById(sessionId)

  if (!session || session.status !== 'computed' || !session.chartOutput || !session.interpretationOutput) {
    notFound()
  }

  const title = session.interpretationOutput.summary.title
  const tags = session.interpretationOutput.summary.tags

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
        <ShareCard title={title} tags={tags} chart={session.chartOutput} />
      </div>
    </main>
  )
}
