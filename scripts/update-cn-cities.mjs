import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(rootDir, 'data/cities/cn-cities.json')

const provinces = await fetchJson('https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/provinces.json')
const cities = await fetchJson('https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/cities.json')

const provinceNameMap = new Map(provinces.map((province) => [province.code, province.name]))
const municipalityProvinceCodes = new Set(['11', '12', '31', '50'])

const mainlandCities = cities
  .filter((city) => !city.name.includes('直辖县级行政区划'))
  .map((city) => {
    const cityName = municipalityProvinceCodes.has(city.provinceCode) && city.name === '市辖区'
      ? provinceNameMap.get(city.provinceCode) ?? city.name
      : city.name

    return {
      provinceCode: city.provinceCode,
      cityCode: `${city.code}00`,
      cityName,
      timezone: 'Asia/Shanghai',
    }
  })
  .sort((left, right) => left.cityCode.localeCompare(right.cityCode, 'zh-Hans-CN'))

await writeFile(outputPath, `${JSON.stringify(mainlandCities, null, 2)}\n`, 'utf8')
console.log(`wrote ${mainlandCities.length} mainland city records to ${outputPath}`)

async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
