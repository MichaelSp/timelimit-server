import assert from 'node:assert/strict'
import test from 'node:test'
import { ReplyToKeyRequestAction } from '../../../../action/replytokeyrequest.js'
import { types } from '../../../../database/keyrequest.js'
import { Cache } from '../cache.js'
import { dispatchReplyToKeyRequestAction } from './replytokeyrequest.js'

const FAMILY_ID = 'ABCDEFGHIJ'
const REQUESTER_ID = 'REQUESTER123'
const TARGET_ID = 'DESKTOP123'

function fixture(request: {
  type: number
  deviceId: string | null
  categoryId: string | null
}) {
  const calls: Array<{ method: string; value?: unknown }> = []
  const dbTransaction = {}
  const cache = {
    familyId: FAMILY_ID,
    transaction: {
      legacy: {
        transaction: dbTransaction,
        database: {
          keyRequest: {
            findOne: async (options: unknown) => {
              calls.push({ method: 'keyRequest.findOne', value: options })
              return {
                senderDeviceId: REQUESTER_ID,
                senderSequenceNumber: '7',
                ...request,
              }
            },
          },
          keyResponse: {
            count: async (...args: unknown[]) => {
              calls.push({ method: 'keyResponse.count', value: args })
              return 0
            },
            create: async (...args: unknown[]) => {
              calls.push({ method: 'keyResponse.create', value: args })
            },
          },
          device: {
            findOne: async () => ({ nextKeyReplySequenceNumber: '20' }),
            update: async (...args: unknown[]) => {
              calls.push({ method: 'device.update', value: args })
            },
          },
        },
      },
    },
    incrementTargetedTriggeredSyncLevel: () => calls.push({ method: 'sync' }),
  } as unknown as Cache
  const eventHandler = { countEvent: () => {} }
  const reply = new ReplyToKeyRequestAction({
    requestServerSequenceNumber: 42,
    tempKey: Buffer.alloc(32),
    encryptedKey: Buffer.alloc(16),
    signature: Buffer.alloc(64),
  })
  return { cache, calls, dbTransaction, eventHandler, reply }
}

test('type 3 reply is rejected unless sent by the exact persisted target device', async () => {
  const f = fixture({
    type: types.desktopInventory,
    deviceId: TARGET_ID,
    categoryId: null,
  })
  await assert.rejects(dispatchReplyToKeyRequestAction({
    deviceId: 'SIBLING123',
    action: f.reply,
    cache: f.cache,
    eventHandler: f.eventHandler as never,
  }))

  const lookup = f.calls.find((call) => call.method === 'keyRequest.findOne')?.value as {
    attributes: string[]
  }
  assert.deepEqual(lookup.attributes, [
    'senderDeviceId', 'senderSequenceNumber', 'type', 'deviceId', 'categoryId',
  ])
  assert.equal(f.calls.some((call) => call.method === 'keyResponse.count'), false)
  assert.equal(f.calls.some((call) => call.method === 'keyResponse.create'), false)
})

test('type 3 reply from the exact target is queued to the requester', async () => {
  const f = fixture({
    type: types.desktopInventory,
    deviceId: TARGET_ID,
    categoryId: null,
  })
  await dispatchReplyToKeyRequestAction({
    deviceId: TARGET_ID,
    action: f.reply,
    cache: f.cache,
    eventHandler: f.eventHandler as never,
  })

  const created = f.calls.find((call) => call.method === 'keyResponse.create')?.value as [Record<string, unknown>]
  assert.equal(created[0].receiverDeviceId, REQUESTER_ID)
  assert.equal(created[0].senderDeviceId, TARGET_ID)
  assert.equal(created[0].requestServerSequenceNumber, '42')
})

test('legacy reply handling remains unchanged for non-type-3 requests', async () => {
  const f = fixture({
    type: types.appListBase,
    deviceId: REQUESTER_ID,
    categoryId: null,
  })
  await dispatchReplyToKeyRequestAction({
    deviceId: 'SIBLING123',
    action: f.reply,
    cache: f.cache,
    eventHandler: f.eventHandler as never,
  })

  assert.ok(f.calls.some((call) => call.method === 'keyResponse.create'))
})
