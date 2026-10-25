import assert from 'node:assert/strict'
import test from 'node:test'
import { SendKeyRequestAction } from '../../../../action/sendkeyrequest.js'
import { types } from '../../../../database/keyrequest.js'
import { Cache } from '../cache.js'
import { dispatchSendKeyRequestAction } from './sendkeyrequest.js'

const FAMILY_ID = 'ABCDEFGHIJ'
const SENDER_ID = 'SRC123'
const DESKTOP_ID = 'DSK123'

const action = ({
  type = types.desktopInventory,
  deviceId = DESKTOP_ID,
  categoryId,
}: {
  type?: number
  deviceId?: string
  categoryId?: string
} = {}) => new SendKeyRequestAction({
  deviceSequenceNumber: 1,
  ...(deviceId ? { deviceId } : {}),
  ...(categoryId ? { categoryId } : {}),
  type,
  tempKey: Buffer.alloc(32),
  signature: Buffer.alloc(64),
})

function fixture(targetDevice: { platformType: string | null; platformLevel: number } | null) {
  const calls: Array<{ method: string; value?: unknown }> = []
  const dbTransaction = {}
  const cache = {
    familyId: FAMILY_ID,
    transaction: {
      legacy: {
        transaction: dbTransaction,
        database: {
          device: {
            findOne: async (options: unknown) => {
              calls.push({ method: 'device.findOne', value: options })
              return targetDevice
            },
          },
          family: {
            findOne: async () => ({ nextServerKeyRequestSeq: '100' }),
            update: async (...args: unknown[]) => {
              calls.push({ method: 'family.update', value: args })
            },
          },
          keyRequest: {
            destroy: async (...args: unknown[]) => {
              calls.push({ method: 'keyRequest.destroy', value: args })
            },
            create: async (...args: unknown[]) => {
              calls.push({ method: 'keyRequest.create', value: args })
            },
          },
        },
      },
    },
    incrementTriggeredSyncLevel: () => calls.push({ method: 'sync' }),
  } as unknown as Cache

  return { cache, calls, dbTransaction }
}

test('type 3 request is stored only for a persisted desktop target at level 1 or higher', async () => {
  const f = fixture({ platformType: 'desktop', platformLevel: 1 })
  await dispatchSendKeyRequestAction({
    action: action(),
    cache: f.cache,
    deviceId: SENDER_ID,
  })

  const targetQuery = f.calls.find((call) => call.method === 'device.findOne')?.value as {
    where: unknown
    attributes: string[]
    transaction: unknown
  }
  assert.deepEqual(targetQuery.where, { familyId: FAMILY_ID, deviceId: DESKTOP_ID })
  assert.deepEqual(targetQuery.attributes, ['platformType', 'platformLevel'])
  assert.strictEqual(targetQuery.transaction, f.dbTransaction)
  const insert = f.calls.find((call) => call.method === 'keyRequest.create')?.value as [Record<string, unknown>]
  assert.equal(insert[0].type, types.desktopInventory)
  assert.equal(insert[0].deviceId, DESKTOP_ID)
  assert.equal(insert[0].categoryId, null)
})

test('type 3 request rejects missing, category-only, and non-desktop targets before writes', async (t) => {
  const cases: Array<[
    string,
    { platformType: string | null; platformLevel: number } | null,
    SendKeyRequestAction,
  ]> = [
    ['missing device', { platformType: 'desktop', platformLevel: 1 }, action({ deviceId: '' })],
    ['category only', null, action({ deviceId: '', categoryId: 'CAT123' })],
    ['unknown device', null, action()],
    ['Android device', { platformType: 'android', platformLevel: 128 }, action()],
    ['desktop without capability', { platformType: 'desktop', platformLevel: 0 }, action()],
    ['device without platform', { platformType: null, platformLevel: 1 }, action()],
  ]

  for (const [label, target, request] of cases) {
    await t.test(label, async () => {
      const f = fixture(target)
      await assert.rejects(dispatchSendKeyRequestAction({
        action: request,
        cache: f.cache,
        deviceId: SENDER_ID,
      }))
      assert.equal(f.calls.some((call) => call.method === 'family.update'), false)
      assert.equal(f.calls.some((call) => call.method === 'keyRequest.create'), false)
    })
  }
})

test('legacy type 1/2 request flow remains unchanged', async () => {
  const f = fixture(null)
  await dispatchSendKeyRequestAction({
    action: action({ type: types.appListBase, deviceId: '', categoryId: 'CAT123' }),
    cache: f.cache,
    deviceId: SENDER_ID,
  })

  assert.equal(f.calls.some((call) => call.method === 'device.findOne'), false)
  assert.ok(f.calls.some((call) => call.method === 'keyRequest.create'))
})
