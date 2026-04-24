import citiesJson from '@/data/cities/cn-cities.json'

export type MainlandCityRecord = (typeof citiesJson)[number]

export const mainlandCityRecords = citiesJson as MainlandCityRecord[]

export const mainlandCityOptions = mainlandCityRecords.map((city) => ({
  code: city.cityCode,
  name: city.cityName,
}))

export function isSupportedMainlandCityCode(cityCode: string) {
  return mainlandCityRecords.some((city) => city.cityCode === cityCode)
}

export function getMainlandCityByCode(cityCode: string) {
  return mainlandCityRecords.find((city) => city.cityCode === cityCode)
}
