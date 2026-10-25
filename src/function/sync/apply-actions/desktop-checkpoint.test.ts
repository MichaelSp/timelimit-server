import assert from 'node:assert/strict'
import test from 'node:test'
import { ClientPushChangesRequest } from '../../../api/schema.js'
import { SimpleDatabase, SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { applyActionsFromDevice } from './index.js'

const checkpoint = (payloadSha256 = 'a'.repeat(64)) => ({
  id: 'desktop-checkpoint-1',
  payloadSha256,
})

const createFixture = ({ failCommit = false } = {}) => {
  let committedReceipts: Array<{
    checkpointId: string
    payloadSha256: string
    acceptedThrough: number
    shouldDoFullSync: boolean
  }> = []
  let actionApplications = 0

  const database = {
    transaction: async <T>(inner: (transaction: SimpleDatabaseTransaction) => Promise<T>): Promise<T> => {
      const stagedReceipts = committedReceipts.map((receipt) => ({ ...receipt }))
      const transaction = {
        transaction: async <U>(nested: (nestedTransaction: SimpleDatabaseTransaction) => Promise<U>) => nested(transaction as SimpleDatabaseTransaction),
        enqueueAfterCommit: () => {},
        legacy: {
          database: {
            device: {
              findOne: async () => ({ familyId: 'ABCDEFGHIJ', deviceId: 'ABC123', nextSequenceNumber: 0 }),
              findAll: async () => {
                actionApplications++
                return []
              },
            },
            family: {
              findOne: async () => ({ hasFullVersion: true }),
            },
            desktopSyncReceipt: {
              findOne: async ({ where }: { where: { checkpointId: string } }) =>
                stagedReceipts.find((receipt) => receipt.checkpointId === where.checkpointId) || null,
              create: async (receipt: {
                checkpointId: string
                payloadSha256: string
                acceptedThrough: number
                shouldDoFullSync: boolean
              }) => {
                stagedReceipts.push(receipt)
              },
            },
          },
          transaction: {},
        },
      } as unknown as SimpleDatabaseTransaction

      const result = await inner(transaction)

      if (failCommit) throw new Error('commit failed')

      committedReceipts = stagedReceipts
      return result
    },
  } as unknown as SimpleDatabase

  const push = (desktopCheckpoint?: ClientPushChangesRequest['desktopCheckpoint']) =>
    applyActionsFromDevice({
      database,
      request: { deviceAuthToken: 'token', actions: [], ...(desktopCheckpoint ? { desktopCheckpoint } : {}) },
      websocket: {} as never,
      connectedDevicesManager: {} as never,
      eventHandler: { countEvent: () => {}, reportMax: () => {}, getValues: async () => ({ counters: {}, maxValues: {} }), reset: async () => {} },
    })

  return {
    push,
    receiptCount: () => committedReceipts.length,
    actionApplications: () => actionApplications,
  }
}

test('legacy push without a desktop checkpoint keeps the legacy response and stores no receipt', async () => {
  const fixture = createFixture()

  assert.deepEqual(await fixture.push(), { shouldDoFullSync: false })
  assert.equal(fixture.receiptCount(), 0)
})

test('a repeated desktop checkpoint returns its stored receipt without applying again', async () => {
  const fixture = createFixture()

  const first = await fixture.push(checkpoint())
  const replay = await fixture.push(checkpoint())

  assert.deepEqual(replay, first)
  assert.equal(fixture.receiptCount(), 1)
  assert.equal(fixture.actionApplications(), 1)
})

test('a reused desktop checkpoint id with another hash conflicts before applying', async () => {
  const fixture = createFixture()
  await fixture.push(checkpoint())

  await assert.rejects(fixture.push(checkpoint('b'.repeat(64))), (error: unknown) =>
    typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 409,
  )
  assert.equal(fixture.receiptCount(), 1)
  assert.equal(fixture.actionApplications(), 1)
})

test('a failed transaction does not leave a desktop receipt', async () => {
  const fixture = createFixture({ failCommit: true })

  await assert.rejects(fixture.push(checkpoint()), /commit failed/)
  assert.equal(fixture.receiptCount(), 0)
  assert.equal(fixture.actionApplications(), 1)
})
