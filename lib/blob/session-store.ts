import { get, put } from '@vercel/blob'

export async function putPrivateJson(pathname: string, value: unknown, options?: { allowOverwrite?: boolean }) {
  return put(pathname, JSON.stringify(value), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: options?.allowOverwrite ?? false,
    contentType: 'application/json; charset=utf-8',
  })
}

export async function getPrivateJson(pathname: string) {
  const result = await get(pathname, {
    access: 'private',
    useCache: false,
  })

  if (!result) {
    return null
  }

  return JSON.parse(await new Response(result.stream).text())
}
