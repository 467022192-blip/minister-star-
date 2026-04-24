import { PrismaClient } from '@prisma/client'

declare global {
  var __ziweiPrismaClient: PrismaClient | undefined
}

export type PersistenceMode = 'memory' | 'prisma'

export function getPersistenceMode(): PersistenceMode {
  const configuredMode = process.env.ZIWEI_PERSISTENCE_MODE

  if (configuredMode === 'memory' || configuredMode === 'prisma') {
    return configuredMode
  }

  return process.env.NODE_ENV === 'test' ? 'memory' : 'prisma'
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
