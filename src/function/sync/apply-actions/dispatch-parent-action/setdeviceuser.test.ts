import assert from 'node:assert/strict'
import test from 'node:test'
import { Cache } from '../cache.js'
import { dispatchSetDeviceUser } from './setdeviceuser.js'

function fixture(currentUserId: string) {
  const calls: Array<{ method: string; value?: unknown }> = []
  const cache = {
    familyId: 'ABCDEFGHIJ',
    doesUserExist: async () => true,
    transaction: { legacy: { transaction: {}, database: {
      device: {
        findOne: async () => ({ currentUserId }),
        update: async () => [1],
      },
      desktopAssignment: { destroy: async (options: unknown) => calls.push({ method: 'destroy', value: options }) },
    } } },
    incrementTriggeredSyncLevel: () => {},
    incrementTargetedTriggeredSyncLevel: () => {},
  } as unknown as Cache
  return { cache, calls }
}

test('changing a desktop device child clears its old typed app assignments', async () => {
  const f = fixture('CHD123')
  await dispatchSetDeviceUser({ action: { deviceId: 'DSK123', userId: 'CHD999' } as never, cache: f.cache })
  assert.deepEqual(f.calls[0].value && (f.calls[0].value as { where: unknown }).where, { familyId: 'ABCDEFGHIJ', deviceId: 'DSK123' })
})

test('setting the same current child keeps existing typed app assignments', async () => {
  const f = fixture('CHD123')
  await dispatchSetDeviceUser({ action: { deviceId: 'DSK123', userId: 'CHD123' } as never, cache: f.cache })
  assert.equal(f.calls.length, 0)
})
