import { afterEach, describe, expect, it } from 'vitest'
import { getDb, getPersistenceMode } from '../../lib/db'

const originalNodeEnv = process.env.NODE_ENV
const originalDatabaseUrl = process.env.DATABASE_URL
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }

  if (originalPersistenceMode === undefined) {
    delete process.env.ZIWEI_PERSISTENCE_MODE
  } else {
    process.env.ZIWEI_PERSISTENCE_MODE = originalPersistenceMode
  }
})

describe('db persistence mode', () => {
  it('defaults to memory when DATABASE_URL is missing outside tests', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    delete process.env.ZIWEI_PERSISTENCE_MODE

    expect(getPersistenceMode()).toBe('memory')
  })

  it('defaults to prisma when DATABASE_URL exists outside tests', () => {
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://example:test@example.com:5432/app'
    delete process.env.ZIWEI_PERSISTENCE_MODE

    expect(getPersistenceMode()).toBe('prisma')
  })

  it('keeps explicit memory mode even when DATABASE_URL exists', () => {
    process.env.NODE_ENV = 'production'
    process.env.DATABASE_URL = 'postgresql://example:test@example.com:5432/app'
    process.env.ZIWEI_PERSISTENCE_MODE = 'memory'

    expect(getPersistenceMode()).toBe('memory')
  })
})

describe('db access', () => {
  it('throws when prisma is forced without DATABASE_URL', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    process.env.ZIWEI_PERSISTENCE_MODE = 'prisma'

    expect(() => getDb()).toThrow('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
  })
})
