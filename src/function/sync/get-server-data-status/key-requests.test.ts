import assert from 'node:assert/strict'
import test from 'node:test'
import { Op } from 'sequelize'
import { SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { getKeyRequests } from './key-requests.js'

type QueryOptions = {
  where: Record<PropertyKey, unknown>
  transaction: unknown
  order: unknown
  limit: number
}

test('pending key requests are ordered before the bounded after-cursor page', async () => {
  let query: QueryOptions | undefined
  const dbTransaction = {}
  const transaction = {
    legacy: {
      transaction: dbTransaction,
      database: {
        keyRequest: {
          findAll: async (options: QueryOptions) => {
            query = options
            return []
          },
        },
      },
    },
  } as unknown as SimpleDatabaseTransaction

  assert.equal(await getKeyRequests({
    transaction,
    familyEntry: { familyId: 'ABCDEFGHIJ' } as never,
    lastSeenRequestIndex: 70,
    deviceId: 'DEV123',
    requestTypes: [1, 2],
  }), null)

  assert.deepEqual(query, {
    where: {
      familyId: 'ABCDEFGHIJ',
      senderDeviceId: { [Op.ne]: 'DEV123' },
      type: { [Op.in]: [1, 2] },
      serverSequenceNumber: { [Op.gt]: 70 },
    },
    transaction: dbTransaction,
    order: [['serverSequenceNumber', 'ASC']],
    limit: 32,
  })
  assert.strictEqual(query?.transaction, dbTransaction)
})

test('desktop key request lookup is limited to type 3 for its exact device target', async () => {
  let query: QueryOptions | undefined
  const transaction = {
    legacy: {
      transaction: {},
      database: {
        keyRequest: {
          findAll: async (options: QueryOptions) => {
            query = options
            return []
          },
        },
      },
    },
  } as unknown as SimpleDatabaseTransaction

  assert.equal(await getKeyRequests({
    transaction,
    familyEntry: { familyId: 'ABCDEFGHIJ' } as never,
    lastSeenRequestIndex: null,
    deviceId: 'DSK123',
    requestTypes: [3],
    targetDeviceOnly: true,
  }), null)

  assert.deepEqual(query?.where, {
    familyId: 'ABCDEFGHIJ',
    senderDeviceId: { [Op.ne]: 'DSK123' },
    type: { [Op.in]: [3] },
    deviceId: 'DSK123',
    categoryId: null,
  })
  assert.deepEqual(query?.order, [['serverSequenceNumber', 'ASC']])
  assert.equal(query?.limit, 32)
})
