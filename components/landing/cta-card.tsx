import { TrackedLink } from '@/components/analytics/tracked-link'

type CtaCardProps = {
  title: string
  description: string
  href: string
  badge: string
}

export function CtaCard({ title, description, href, badge }: CtaCardProps) {
  const eventName = href === '/chart' ? 'chart_started' : 'quiz_started'

  return (
    <TrackedLink
      href={href}
      eventName={eventName}
      eventPayload={{ source: 'landing-module', badge }}
      className="group block cursor-pointer rounded-[1.75rem] border border-primary/10 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-editorial"
    >
      <span className="inline-flex rounded-full border border-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-secondary">
        {badge}
      </span>
      <h3 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.03em] text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-secondary">{description}</p>
      <div className="mt-8 text-sm font-medium text-accent transition-colors duration-200 group-hover:text-primary">
        进入 →
      </div>
    </TrackedLink>
  )
}
