'use client'
import { mainlandCityOptions } from '@/lib/cities'

type CitySelectorProps = {
  value: string
  onChange: (value: string) => void
}

export function CitySelector({ value, onChange }: CitySelectorProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-primary">出生地（市级）</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-primary outline-none transition-colors duration-200 focus:border-primary"
      >
        <option value="">请选择出生城市</option>
        {mainlandCityOptions.map((city) => (
          <option key={city.code} value={city.code}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  )
}
