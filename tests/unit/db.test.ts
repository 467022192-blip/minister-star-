import { afterEach, describe, expect, it } from 'vitest'
import { getDb, getPersistenceMode } from '../../lib/db'

const originalNodeEnv = process.env.NODE_ENV
const originalDatabaseUrl = process.env.DATABASE_URL
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN
const originalPersistenceMode = process.env.ZIWEI_PERSISTENCE_MODE

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }

  if (originalBlobToken === undefined) {
    delete process.env.BLOB_READ_WRITE_TOKEN
  } else {
    process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken
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

  it('defaults to blob when DATABASE_URL is missing and BLOB_READ_WRITE_TOKEN exists outside tests', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
    delete process.env.ZIWEI_PERSISTENCE_MODE

    expect(getPersistenceMode()).toBe('blob')
  })

  it('keeps explicit blob mode when BLOB_READ_WRITE_TOKEN exists', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'

    expect(getPersistenceMode()).toBe('blob')
  })
})

describe('db access', () => {
  it('throws when prisma is forced without DATABASE_URL', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    process.env.ZIWEI_PERSISTENCE_MODE = 'prisma'

    expect(() => getDb()).toThrow('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
  })

  it('throws when blob is forced without BLOB_READ_WRITE_TOKEN', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DATABASE_URL
    delete process.env.BLOB_READ_WRITE_TOKEN
    process.env.ZIWEI_PERSISTENCE_MODE = 'blob'

    expect(() => getPersistenceMode()).toThrow('BLOB_READ_WRITE_TOKEN is required when ZIWEI_PERSISTENCE_MODE=blob')
  })
})
