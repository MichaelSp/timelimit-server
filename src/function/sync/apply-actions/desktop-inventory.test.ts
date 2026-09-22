import assert from 'node:assert/strict'
import test from 'node:test'
import { UpdateDesktopInventoryAction } from '../../../action/updatedesktopinventory.js'
import { parseAppLogicAction } from '../../../action/serialization/applogicaction.js'
import { types } from '../../../database/encryptedapplist.js'
import { SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { getDeviceDetailList } from '../get-server-data-status/device-detail.js'
import { dispatchUpdateDesktopInventory } from './dispatch-app-logic-action/updatedesktopinventory.js'

test('parses only a bounded, canonical format-3 desktop ciphertext action', () => {
  const parsed = parseAppLogicAction({
    type: 'UPDATE_DESKTOP_INVENTORY',
    data: Buffer.from('format-3 ciphertext').toString('base64'),
  })

  assert.ok(parsed instanceof UpdateDesktopInventoryAction)
  assert.equal(parsed.ciphertext.toString(), 'format-3 ciphertext')
  assert.throws(() => parseAppLogicAction({
    type: 'UPDATE_DESKTOP_INVENTORY',
    data: 'not base64!',
  }))
  // Non-zero pad bits decode to bytes, but are not canonical base64.
  for (const data of ['Zh==', 'Zm9=']) {
    assert.throws(() => parseAppLogicAction({
      type: 'UPDATE_DESKTOP_INVENTORY',
      data,
    }))
  }
  assert.throws(() => new UpdateDesktopInventoryAction({
    ciphertext: Buffer.alloc(512 * 1024 + 1),
  }))
})

test('dispatch stores opaque desktop inventory only in encrypted app-list type 3', async () => {
  let stored: Record<string, unknown> | undefined
  let triggered = 0

  await dispatchUpdateDesktopInventory({
    deviceId: 'ABC123',
    action: new UpdateDesktopInventoryAction({ ciphertext: Buffer.from('opaque') }),
    cache: {
      familyId: 'ABCDEFGHIJ',
      incrementTriggeredSyncLevel: () => { triggered++ },
      transaction: {
        legacy: {
          database: {
            device: {
              findOne: async () => ({ platformType: 'desktop', platformLevel: 1 }),
            },
            encryptedAppList: {
              upsert: async (value: Record<string, unknown>) => { stored = value },
            },
          },
          transaction: {},
        },
      },
    } as never,
  })

  assert.equal(stored?.type, types.desktopInventory)
  assert.deepEqual(stored?.data, Buffer.from('opaque'))
  assert.equal(triggered, 1)
})

test('desktop inventory dispatch requires the persisted desktopSync capability', async () => {
  await assert.rejects(dispatchUpdateDesktopInventory({
    deviceId: 'ABC123',
    action: new UpdateDesktopInventoryAction({ ciphertext: Buffer.from('opaque') }),
    cache: {
      familyId: 'ABCDEFGHIJ',
      incrementTriggeredSyncLevel: () => {},
      transaction: {
        legacy: {
          database: {
            device: { findOne: async () => ({ platformType: 'android', platformLevel: 128 }) },
            encryptedAppList: { upsert: async () => assert.fail('must not store') },
          },
          transaction: {},
        },
      },
    } as never,
  }))
})

test('status capability lanes never add empty device rows to legacy or non-opted responses', async () => {
  const baseRow = {
    deviceId: 'ABC123', type: types.base, version: 'B123', data: Buffer.from('android'),
  }
  const desktopRow = {
    deviceId: 'ABC123', type: types.desktopInventory, version: 'D123', data: Buffer.from('opaque'),
  }
  const transaction = {
    legacy: {
      database: {
        encryptedAppList: {
          findAll: async ({ where }: { where: { type?: number } }) => {
            const rows = [baseRow, desktopRow]
            if (where.type === undefined) return rows
            return rows.filter((item) => item.type === where.type)
          },
        },
      },
      transaction: {},
    },
  } as unknown as SimpleDatabaseTransaction

  const request = (includeLegacyCryptoApps: boolean, includeDesktopInventory: boolean) => getDeviceDetailList({
    transaction,
    familyEntry: { familyId: 'ABCDEFGHIJ' } as never,
    devicesDetail: {},
    includeLegacyCryptoApps,
    includeDesktopInventory,
  })

  // Legacy and clientLevel-4-but-not-desktopSync clients receive no type-3
  // row. The former does not call this helper in production; this proves the
  // filter is safe even if that changes.
  assert.equal(await request(false, false), null)
  assert.deepEqual(await request(true, false), [{
    deviceId: 'ABC123',
    appsBase: { version: 'B123', data: Buffer.from('android').toString('base64') },
  }])
  assert.deepEqual(await request(false, true), [{
    deviceId: 'ABC123',
    desktopInventory: { version: 'D123', data: Buffer.from('opaque').toString('base64') },
  }])
})
