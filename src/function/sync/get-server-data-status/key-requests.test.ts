import assert from 'node:assert/strict'
import test from 'node:test'
import { Op } from 'sequelize'
import { SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { getKeyRequests } from './key-requests.js'

test('pending key requests are ordered before the bounded after-cursor page', async () => {
  type QueryOptions = {
    where: unknown
    transaction: unknown
    order: unknown
    limit: number
  }
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
    deviceId: 'DEVICE123',
  }), null)

  assert.deepEqual(query, {
    where: {
      familyId: 'ABCDEFGHIJ',
      senderDeviceId: { [Op.ne]: 'DEVICE123' },
      serverSequenceNumber: { [Op.gt]: 70 },
    },
    transaction: dbTransaction,
    order: [['serverSequenceNumber', 'ASC']],
    limit: 32,
  })
  assert.strictEqual(query?.transaction, dbTransaction)
})
