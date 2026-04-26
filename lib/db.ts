import { PrismaClient } from '@prisma/client'

declare global {
  var __ziweiPrismaClient: PrismaClient | undefined
}

export type PersistenceMode = 'memory' | 'prisma' | 'blob'

export function getPersistenceMode(): PersistenceMode {
  const configuredMode = process.env.ZIWEI_PERSISTENCE_MODE

  if (configuredMode === 'memory') {
    return 'memory'
  }

  if (configuredMode === 'blob') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required when ZIWEI_PERSISTENCE_MODE=blob')
    }

    return 'blob'
  }

  if (configuredMode === 'prisma') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
    }

    return 'prisma'
  }

  if (process.env.NODE_ENV === 'test') {
    return 'memory'
  }

  if (process.env.DATABASE_URL) {
    return 'prisma'
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return 'blob'
  }

  return 'memory'
}

export function getDb() {
  if (getPersistenceMode() !== 'prisma') {
    throw new Error('Prisma client requested while ZIWEI_PERSISTENCE_MODE is not prisma')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
  }

  if (!global.__ziweiPrismaClient) {
    global.__ziweiPrismaClient = new PrismaClient()
  }

  return global.__ziweiPrismaClient
}
