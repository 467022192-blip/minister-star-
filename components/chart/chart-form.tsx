'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitChartInput } from '@/app/chart/actions'
import { emitAnalyticsEvent } from '@/lib/analytics/emit'
import { CitySelector } from './city-selector'

type ChartFormState = {
  calendarType: 'solar' | 'lunar'
  birthDate: string
  birthTime: string
  gender: 'female' | 'male'
  birthCityCode: string
  timeMode: 'clock' | 'shichen'
}

const initialState: ChartFormState = {
  calendarType: 'solar',
  birthDate: '',
  birthTime: '',
  gender: 'female',
  birthCityCode: '',
  timeMode: 'clock',
}

const shichenOptions = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时']

export function ChartForm() {
  const router = useRouter()
  const [form, setForm] = useState<ChartFormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const summary = useMemo(() => {
    if (!form.birthCityCode || !form.birthDate || !form.birthTime) {
      return '先补全出生信息，之后会进入真实排盘。'
    }

    return `已准备进入真实排盘：${form.calendarType === 'solar' ? '阳历' : '农历'} · ${form.birthDate} · ${form.birthTime}`
  }, [form])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const result = await submitChartInput({
        calendarType: form.calendarType,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        gender: form.gender,
        birthCityCode: form.birthCityCode,
      })

      if (result.status === 'computed') {
        await emitAnalyticsEvent('chart_completed', { sessionId: result.sessionId })
        router.push(`/result/${result.sessionId}`)
        return
      }

      setSubmissionError('排盘失败，请检查出生信息后重试。若你使用农历/时辰，请确认输入完整。')
    } catch (error) {
      setSubmissionError(getChartFormErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
      <form className="space-y-6 rounded-[2rem] border border-primary/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">真实排盘输入</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-primary">
            在兴趣建立之后，收集关键出生信息
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-primary">历法</span>
            <select
              value={form.calendarType}
              onChange={(event) =>
                setForm((current) => ({ ...current, calendarType: event.target.value as ChartFormState['calendarType'] }))
              }
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            >
              <option value="solar">阳历</option>
              <option value="lunar">农历</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-primary">性别</span>
            <select
              value={form.gender}
              onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as ChartFormState['gender'] }))}
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            >
              <option value="female">女</option>
              <option value="male">男</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-primary">出生日期</span>
            <input
              type="date"
              value={form.birthDate}
              onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-primary">时间模式</span>
            <select
              value={form.timeMode}
              onChange={(event) => setForm((current) => ({ ...current, timeMode: event.target.value as ChartFormState['timeMode'], birthTime: '' }))}
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            >
              <option value="clock">具体时间</option>
              <option value="shichen">时辰</option>
            </select>
          </label>
        </div>

        {form.timeMode === 'clock' ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-primary">出生时间</span>
            <input
              type="time"
              value={form.birthTime}
              onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))}
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            />
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-primary">出生时辰</span>
            <select
              value={form.birthTime}
              onChange={(event) => setForm((current) => ({ ...current, birthTime: event.target.value }))}
              className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
            >
              <option value="">请选择时辰</option>
              {shichenOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <CitySelector value={form.birthCityCode} onChange={(birthCityCode) => setForm((current) => ({ ...current, birthCityCode }))} />

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void handleSubmit()
          }}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-7 py-4 text-base font-medium text-white transition-colors duration-200 hover:bg-secondary"
        >
          {isSubmitting ? '正在生成真实命盘...' : '进入真实命盘结果页'}
        </button>

        {submissionError ? <p className="text-sm leading-7 text-accent">{submissionError}</p> : null}
      </form>

      <aside className="rounded-[2rem] border border-primary/10 bg-primary p-6 text-white shadow-editorial">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">输入策略</p>
        <h3 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em]">出生地必填到市级</h3>
        <p className="mt-4 text-sm leading-7 text-white/75">
          这里保留传统关键输入：历法、出生时刻/时辰、性别、城市。首版先保证输入闭环，再推进规则与结果的准确性验证。
        </p>
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/80">
          {summary}
        </div>
      </aside>
    </div>
  )
}

function getChartFormErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return '输入有误，请检查出生信息后重试。'
  }

  if (error.message.includes('birthCityCode')) {
    return error.message.includes('supported mainland city')
      ? '请选择受支持的大陆市级出生地。'
      : '请先补全出生地到市级，再进入真实排盘。'
  }

  if (error.message.includes('birthDate')) {
    return '请先补全出生日期。'
  }

  if (error.message.includes('birthTime')) {
    return '请先补全出生时间或时辰。'
  }

  return '输入有误，请检查出生信息后重试。'
}
