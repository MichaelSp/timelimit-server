import assert from 'node:assert/strict'
import test from 'node:test'
import { Op, Sequelize } from 'sequelize'
import { createDesktopAssignmentModel, isDesktopBundleId } from '../../../database/desktopassignment.js'
import { SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { ServerDesktopPolicy } from '../../../object/serverdatastatus.js'
import { isClientPullChangesRequest } from '../../../api/validator.js'
import { boundDesktopPolicy } from './desktop-policy.js'
import { generateServerDataStatus } from './index.js'

const category = {
  categoryId: 'CAT123', childId: 'CHD123', title: 'Study', baseVersion: 'BASE',
  assignedAppsVersion: 'APPS', timeLimitRulesVersion: 'RULE', usedTimesVersion: 'USED', taskListVersion: 'TASK',
  blockedMinutesInWeek: '', extraTimeInMillis: 0, extraTimeDay: 0, temporarilyBlocked: false,
  parentCategoryId: '', blockAllNotifications: false, timeWarningFlags: 0, minBatteryCharging: 0,
  minBatteryMobile: 0, temporarilyBlockedEndTime: '0', sort: 0, disableLimitsUntil: '0', flags: '0', blockNotificationDelay: '0',
}

test('pull request validator accepts only the independent v2 opt-in shape', () => {
  const base = { deviceAuthToken: 'x', status: { devices: '', apps: {}, categories: {}, users: '', desktopSync: { version: 1 } } }
  assert.equal(isClientPullChangesRequest({ ...base, status: { ...base.status, desktopPolicy: { version: 2 } } }), true)
  assert.equal(isClientPullChangesRequest({ ...base, status: { ...base.status, desktopPolicy: { version: 1 } } }), false)
  assert.equal(isClientPullChangesRequest({ ...base, status: { ...base.status, desktopSync: { version: 2 } } }), false)
  assert.equal(isClientPullChangesRequest({ ...base, status: { ...base.status, desktopPolicy: { version: 2, extra: true } } }), false)
})

function fixture() {
  let assignmentReads = 0
  const keyRequestQueries: Array<{ where: Record<PropertyKey, unknown>; order: unknown; limit: number }> = []
  const child = { type: 'child', timeZone: 'Europe/Berlin', disableTimelimitsUntil: '0', blockedTimes: '', categoryForNotAssignedApps: '', flags: '0', relaxPrimaryDeviceRule: true, currentDevice: '' }
  const rows = [{ familyId: 'ABCDEFGHIJ', deviceId: 'DEV123', categoryId: 'CAT123', platform: 'macos', bundleId: 'com.example.study' }]
  const empty = { findAll: async () => [] }
  const keyRequestRows = [
    { familyId: 'ABCDEFGHIJ', serverSequenceNumber: '1', senderDeviceId: 'PARENT123', senderSequenceNumber: '1', deviceId: 'DEV123', categoryId: null, type: 1, tempKey: Buffer.alloc(32), signature: Buffer.alloc(64) },
    { familyId: 'ABCDEFGHIJ', serverSequenceNumber: '2', senderDeviceId: 'PARENT123', senderSequenceNumber: '2', deviceId: 'DEV123', categoryId: null, type: 2, tempKey: Buffer.alloc(32), signature: Buffer.alloc(64) },
    { familyId: 'ABCDEFGHIJ', serverSequenceNumber: '3', senderDeviceId: 'PARENT123', senderSequenceNumber: '3', deviceId: 'DEV123', categoryId: null, type: 3, tempKey: Buffer.alloc(32), signature: Buffer.alloc(64) },
    { familyId: 'ABCDEFGHIJ', serverSequenceNumber: '4', senderDeviceId: 'PARENT123', senderSequenceNumber: '4', deviceId: 'OTHER123', categoryId: null, type: 3, tempKey: Buffer.alloc(32), signature: Buffer.alloc(64) },
    { familyId: 'ABCDEFGHIJ', serverSequenceNumber: '5', senderDeviceId: 'DEV123', senderSequenceNumber: '5', deviceId: 'DEV123', categoryId: null, type: 3, tempKey: Buffer.alloc(32), signature: Buffer.alloc(64) },
  ]
  const transaction = { legacy: { transaction: {}, database: {
    family: { findOne: async () => ({ deviceListVersion: 'DEVS', userListVersion: 'USER', fullVersionUntil: '0', hasFullVersion: false }) },
    config: { findByPk: async () => null },
    category: { findAll: async () => [category] },
    categoryApp: { findAll: async () => [{ categoryId: 'CAT123', packageName: 'com.android.app' }] },
    categoryNetworkId: empty, categoryTimeWarning: empty, timelimitRule: empty, usedTime: empty, sessionDuration: empty, encryptedAppList: empty,
    keyRequest: { findAll: async (options: { where: Record<PropertyKey, unknown>; order: unknown; limit: number }) => {
      keyRequestQueries.push(options)
      const where = options.where
      const typeFilter = where.type as Record<PropertyKey, number[]>
      const senderFilter = where.senderDeviceId as Record<PropertyKey, string>
      const cursorFilter = where.serverSequenceNumber as Record<PropertyKey, number> | undefined
      const acceptedTypes = typeFilter[Op.in]
      const senderDeviceId = senderFilter[Op.ne]
      const cursor = cursorFilter?.[Op.gt]
      return keyRequestRows
        .filter((item) => item.familyId === where.familyId && item.senderDeviceId !== senderDeviceId)
        .filter((item) => acceptedTypes.includes(item.type))
        .filter((item) => where.deviceId === undefined || item.deviceId === where.deviceId)
        .filter((item) => where.categoryId === undefined || item.categoryId === where.categoryId)
        .filter((item) => cursor === undefined || Number(item.serverSequenceNumber) > cursor)
        .sort((left, right) => Number(left.serverSequenceNumber) - Number(right.serverSequenceNumber))
        .slice(0, options.limit)
    } },
    keyResponse: { findAll: async () => [] },
    device: { findOne: async ({ where }: { where: unknown }) => {
      assert.deepEqual(where, { familyId: 'ABCDEFGHIJ', deviceId: 'DEV123' })
      return { currentUserId: 'CHD123' }
    } },
    user: { findOne: async () => child },
    desktopAssignment: { findAll: async ({ where, limit }: { where: unknown; limit: number }) => {
      assert.deepEqual(where, { familyId: 'ABCDEFGHIJ', deviceId: 'DEV123' })
      assert.equal(limit, 4097)
      assignmentReads++
      return rows
    } },
  } } } as unknown as SimpleDatabaseTransaction
  const request = (desktop: boolean, unchanged = false, policyVersion?: 2, clientLevel?: number) => generateServerDataStatus({
    transaction, familyId: 'ABCDEFGHIJ', deviceId: 'DEV123', eventHandler: {} as never,
    clientStatus: {
      devices: 'DEVS', users: 'USER', apps: {},
      ...(clientLevel !== undefined ? { clientLevel } : {}),
      categories: unchanged ? { CAT123: { base: 'BASE', apps: 'APPS', rules: 'RULE', usedTime: 'USED', tasks: 'TASK' } } : {},
      ...(desktop ? { desktopSync: { version: 1 } as const } : {}),
      ...(policyVersion ? { desktopPolicy: { version: policyVersion } as const } : {}),
    },
  })
  return { request, child, rows, assignmentReads: () => assignmentReads, keyRequestQueries }
}

test('desktopSync receives only targeted type 3 requests while Android keeps legacy requests', async () => {
  const f = fixture()
  const desktop = await f.request(true)
  assert.deepEqual(desktop.krq?.map((request) => request.type), [3])
  assert.equal(desktop.kr, undefined)
  assert.deepEqual(f.keyRequestQueries[0].where.type, { [Op.in]: [3] })
  assert.equal(f.keyRequestQueries[0].where.deviceId, 'DEV123')
  assert.equal(f.keyRequestQueries[0].where.categoryId, null)
  assert.equal(f.keyRequestQueries[0].limit, 32)

  const android = await f.request(false, true, undefined, 4)
  assert.deepEqual(android.krq?.map((request) => request.type), [1, 2])
  assert.deepEqual(f.keyRequestQueries[1].where.type, { [Op.in]: [1, 2] })
  assert.equal(f.keyRequestQueries[1].where.deviceId, undefined)

  const legacy = await f.request(false)
  assert.equal(legacy.krq, undefined)
  assert.equal(f.keyRequestQueries.length, 2)
})

test('desktop projection is negotiated, full on unchanged status, and never changes Android packages', async () => {
  const f = fixture()
  const legacy = await f.request(false)
  assert.equal(legacy.desktopPolicy, undefined)
  assert.equal(f.assignmentReads(), 0)
  const desktop = await f.request(true)
  assert.deepEqual(desktop.categoryApp, legacy.categoryApp)
  assert.deepEqual(desktop.desktopPolicy?.assignments, [{ categoryId: 'CAT123', platform: 'macos', bundleId: 'com.example.study' }])
  assert.equal(desktop.desktopPolicy?.categoryBase[0].categoryId, 'CAT123')
  const unchanged = await f.request(true, true)
  assert.equal(unchanged.categoryApp, undefined)
  assert.deepEqual(unchanged.desktopPolicy, desktop.desktopPolicy)
  f.child.timeZone = 'europe/berlin'
  const version2 = await f.request(true, false, 2)
  assert.equal(version2.desktopPolicy?.version, 2)
  if (version2.desktopPolicy?.version === 2) {
    // The Rust chrono-tz parser requires the canonical casing.
    assert.equal(version2.desktopPolicy.timeZone, 'Europe/Berlin')
    assert.ok(Number.isSafeInteger(version2.desktopPolicy.serverTimeMs))
  }
  assert.equal((await f.request(true)).desktopPolicy?.version, 1)
})

test('version 2 rejects invalid IANA zones while version 1 stays available', async () => {
  const f = fixture()
  f.child.timeZone = '../etc/localtime'
  assert.equal((await f.request(true, false, 2)).desktopPolicy, undefined)
  assert.equal((await f.request(true)).desktopPolicy?.version, 1)
  f.child.timeZone = 'Europe/Berlin'
  assert.equal((await f.request(true, false, 2)).desktopPolicy?.version, 2)
})

test('unsupported user scope and stale/invalid mappings omit the entire projection', async () => {
  const f = fixture()
  f.child.categoryForNotAssignedApps = 'CAT123'
  assert.equal((await f.request(true)).desktopPolicy, undefined)
  assert.equal(f.assignmentReads(), 0)
  f.child.categoryForNotAssignedApps = ''
  f.rows[0].categoryId = 'OTHER1'
  assert.equal((await f.request(true)).desktopPolicy, undefined)
  f.rows[0].categoryId = 'CAT123'
  f.rows[0].bundleId = '/Applications/Study.app'
  assert.equal((await f.request(true)).desktopPolicy, undefined)
})

test('canonical bundle validation and model validation reject untyped or path identities', async () => {
  const sequelize = new Sequelize('postgres://localhost/unused', { logging: false })
  const model = createDesktopAssignmentModel(sequelize)
  const values = { familyId: 'ABCDEFGHIJ', deviceId: 'DEV123', categoryId: 'CAT123', platform: 'macos' as const, bundleId: 'com.example.study' }
  await model.build(values).validate()
  for (const bundleId of ['', 'app', 'com..app', 'com.Example.App', 'com.-app', 'com.app-', 'file:///App.app', 'com.' + 'a'.repeat(64), 'a.'.repeat(128) + 'a']) {
    assert.equal(isDesktopBundleId(bundleId), false)
    await assert.rejects(model.build({ ...values, bundleId }).validate())
  }
  await assert.rejects(model.build({ ...values, platform: 'android' } as never).validate())
  await sequelize.close()
})

test('projection rejects duplicates and excessive data and sorts assignments deterministically', async () => {
  const policy = (await fixture().request(true)).desktopPolicy as ServerDesktopPolicy
  policy.assignments.push({ categoryId: 'CAT123', platform: 'macos', bundleId: 'com.example.alpha' })
  const ordered = boundDesktopPolicy(policy)!
  assert.deepEqual(ordered.assignments.map((item) => item.bundleId), ['com.example.alpha', 'com.example.study'])
  const duplicate = structuredClone(ordered)
  duplicate.assignments.push(duplicate.assignments[0])
  assert.equal(boundDesktopPolicy(duplicate), undefined)
  const oversized = structuredClone(ordered)
  oversized.assignments = Array.from({ length: 4096 }, (_, i) => ({ categoryId: 'CAT123', platform: 'macos', bundleId: `com.example.app${i}` }))
  assert.equal(boundDesktopPolicy(oversized), undefined)
})
