import assert from 'node:assert/strict'
import test from 'node:test'
import { SetDesktopAppCategoryAction } from '../../../../action/setdesktopappcategory.js'
import { parseParentAction } from '../../../../action/serialization/parentaction.js'
import { isSerializedParentAction } from '../../../../api/validator.js'
import { Cache } from '../cache.js'
import { dispatchSetDesktopAppCategory } from './setdesktopappcategory.js'

const action = (patch: Partial<{ deviceId: string; childId: string; bundleId: string; categoryId: string }> = {}) =>
  new SetDesktopAppCategoryAction({
    deviceId: 'DSK123', childId: 'CHD123', bundleId: 'com.example.study', categoryId: 'CAT123', ...patch,
  })

function fixture({ device = { platformType: 'desktop', platformLevel: 1, currentUserId: 'CHD123' }, category = { categoryId: 'CAT123', childId: 'CHD123' }, assignmentCount = 0, existingAssignment = false }: {
  device?: { platformType: string | null; platformLevel: number; currentUserId: string | null } | null
  category?: { categoryId: string; childId: string } | null
  assignmentCount?: number
  existingAssignment?: boolean
} = {}) {
  const calls: Array<{ method: string; value?: unknown }> = []
  const transaction = {}
  const cache = {
    familyId: 'ABCDEFGHIJ',
    transaction: { legacy: { transaction, database: {
      family: { findOne: async (options: unknown) => { calls.push({ method: 'family.findOne', value: options }); return { familyId: 'ABCDEFGHIJ' } } },
      device: { findOne: async (options: unknown) => { calls.push({ method: 'device.findOne', value: options }); return device } },
      user: { findOne: async () => ({ userId: 'CHD123' }) },
      category: { findOne: async () => category },
      desktopAssignment: {
        findOne: async (options: unknown) => { calls.push({ method: 'assignment.findOne', value: options }); return existingAssignment ? { deviceId: 'DSK123' } : null },
        findAll: async (options: unknown) => { calls.push({ method: 'assignment.findAll', value: options }); return Array.from({ length: assignmentCount }, () => ({ deviceId: 'DSK123' })) },
        upsert: async (...args: unknown[]) => calls.push({ method: 'upsert', value: args }),
        destroy: async (...args: unknown[]) => calls.push({ method: 'destroy', value: args }),
      },
    } } },
    incrementTriggeredSyncLevel: (level: number) => calls.push({ method: 'sync', value: level }),
  } as unknown as Cache
  return { cache, calls, transaction }
}

test('set desktop app category upserts a family and device scoped assignment', async () => {
  const f = fixture()
  await dispatchSetDesktopAppCategory({ action: action(), cache: f.cache })
  const write = f.calls.find((call) => call.method === 'upsert')?.value as [Record<string, unknown>, { transaction: unknown }]
  assert.deepEqual(write[0], {
    familyId: 'ABCDEFGHIJ', deviceId: 'DSK123', categoryId: 'CAT123', platform: 'macos', bundleId: 'com.example.study',
  })
  assert.strictEqual(write[1].transaction, f.transaction)
  const replace = (f.calls.find((call) => call.method === 'destroy')?.value as [{ where: Record<string, unknown>; transaction: unknown }])[0]
  assert.deepEqual(replace.where, { familyId: 'ABCDEFGHIJ', deviceId: 'DSK123', platform: 'macos', bundleId: 'com.example.study' })
  assert.strictEqual(replace.transaction, f.transaction)
  assert.deepEqual(f.calls.find((call) => call.method === 'sync')?.value, 2)
})

test('typed parent action serializes through the authenticated action contract', () => {
  const serialized = { type: 'SET_DESKTOP_APP_CATEGORY', deviceId: 'DSK123', childId: 'CHD123', bundleId: 'com.example.study', categoryId: 'CAT123' } as const
  assert.equal(isSerializedParentAction(serialized), true)
  assert.ok(parseParentAction(serialized) instanceof SetDesktopAppCategoryAction)
  assert.equal(isSerializedParentAction({ ...serialized, categoryId: '../bad' }), true) // parsed action constructor rejects malformed IDs
  assert.throws(() => parseParentAction({ ...serialized, categoryId: '../bad' }))
  assert.throws(() => parseParentAction({ ...serialized, bundleId: 'Applications/Study.app' }))
})

test('unassign deletes the exact device and bundle mapping', async () => {
  const f = fixture()
  await dispatchSetDesktopAppCategory({ action: action({ categoryId: '' }), cache: f.cache })
  const write = (f.calls.find((call) => call.method === 'destroy')?.value as [{ where: Record<string, unknown>; transaction: unknown }])[0]
  assert.deepEqual(write.where, { familyId: 'ABCDEFGHIJ', deviceId: 'DSK123', platform: 'macos', bundleId: 'com.example.study' })
  assert.strictEqual(write.transaction, f.transaction)
})

test('new assignments respect family snapshot capacity while reassignment remains possible at capacity', async () => {
  const full = fixture({ assignmentCount: 4096 })
  await assert.rejects(dispatchSetDesktopAppCategory({ action: action(), cache: full.cache }), /desktop assignment limit reached/)
  assert.equal(full.calls.some((call) => call.method === 'upsert' || call.method === 'destroy'), false)

  const reassignment = fixture({ assignmentCount: 4096, existingAssignment: true, category: { categoryId: 'CAT999', childId: 'CHD123' } })
  await dispatchSetDesktopAppCategory({ action: action({ categoryId: 'CAT999' }), cache: reassignment.cache })
  assert.equal(reassignment.calls.some((call) => call.method === 'upsert'), true)
  assert.equal(reassignment.calls.some((call) => call.method === 'assignment.findAll'), false)
})

test('stale or invalid targets and categories are rejected before assignment writes', async (t) => {
  const cases = [
    ['unknown device', { device: null }],
    ['Android device', { device: { platformType: 'android', platformLevel: 128, currentUserId: 'CHD123' } }],
    ['desktop without capability', { device: { platformType: 'desktop', platformLevel: 0, currentUserId: 'CHD123' } }],
    ['reassigned device', { device: { platformType: 'desktop', platformLevel: 1, currentUserId: 'OTHER1' } }],
    ['wrong child category', { category: { categoryId: 'CAT123', childId: 'OTHER1' } }],
    ['missing category', { category: null }],
  ] as const
  for (const [name, values] of cases) await t.test(name, async () => {
    const f = fixture(values)
    await assert.rejects(dispatchSetDesktopAppCategory({ action: action(), cache: f.cache }))
    assert.equal(f.calls.some((call) => call.method === 'upsert' || call.method === 'destroy'), false)
  })
  const f = fixture()
  assert.throws(() => action({ bundleId: 'Applications/Study.app' }))
  assert.equal(f.calls.some((call) => call.method === 'upsert' || call.method === 'destroy'), false)
})
