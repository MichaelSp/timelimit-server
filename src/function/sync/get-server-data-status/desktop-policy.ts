import { isDesktopBundleId } from '../../../database/desktopassignment.js'
import { SimpleDatabaseTransaction } from '../../../database/simple/index.js'
import { ServerDesktopPolicy } from '../../../object/serverdatastatus.js'
import { getCategoryBaseDatas, getRules, getUsedTimes } from './category/index.js'
import { ServerCategoryVersions } from './category/diff.js'
import { FamilyEntry } from './family-entry.js'

const MAX_ITEMS = 4096
const id = (value: string) => /^[a-zA-Z0-9]{6}$/.test(value)
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0

function canonicalDesktopTimeZone(value: string): string | undefined {
  // Named IANA zones only, no offsets, whitespace, or filesystem-like paths.
  if (typeof value !== 'string' || value.length > 128 ||
    !/^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+)*$/.test(value)) return undefined
  try {
    const canonical = new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone
    return canonical.length <= 128 &&
      /^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+)*$/.test(canonical)
      ? canonical
      : undefined
  } catch {
    return undefined
  }
}

// Reject the entire snapshot, never truncate policy into apparent completeness.
export function boundDesktopPolicy(policy: ServerDesktopPolicy): ServerDesktopPolicy | undefined {
  if (policy.version === 2) {
    const timeZone = canonicalDesktopTimeZone(policy.timeZone)
    if (!timeZone || !Number.isSafeInteger(policy.serverTimeMs) || policy.serverTimeMs < 1 ||
      policy.serverTimeMs > 253402300799999) return undefined
    policy.timeZone = timeZone
  }
  if (!id(policy.deviceId) || !id(policy.childId)) return undefined
  const categories = new Set(policy.categoryBase.map((item) => item.categoryId))
  if (categories.size !== policy.categoryBase.length || policy.categoryBase.some(
    (item) => !id(item.categoryId) || item.childId !== policy.childId,
  )) return undefined
  for (const groups of [policy.rules, policy.usedTimes]) {
    if (groups.length !== categories.size || new Set(groups.map((item) => item.categoryId)).size !== categories.size ||
      groups.some((item) => !categories.has(item.categoryId))) return undefined
  }
  const identities = new Set<string>()
  for (const item of policy.assignments) {
    if (item.platform !== 'macos' || !isDesktopBundleId(item.bundleId) || !categories.has(item.categoryId) || identities.has(item.bundleId)) return undefined
    identities.add(item.bundleId)
  }
  const count = policy.categoryBase.length + policy.assignments.length +
    policy.rules.reduce((n, item) => n + item.rules.length, 0) +
    policy.usedTimes.reduce((n, item) => n + item.times.length + item.sessionDurations.length, 0) +
    policy.categoryBase.reduce((n, item) => n + item.networks.length + item.atw.length, 0)
  if (count > MAX_ITEMS || Buffer.byteLength(JSON.stringify(policy)) > 512 * 1024) return undefined
  // Byte-order sorting is independent of database collation and host locale.
  policy.categoryBase.sort((a, b) => compare(a.categoryId, b.categoryId))
  policy.assignments.sort((a, b) => compare(a.bundleId, b.bundleId))
  policy.rules.sort((a, b) => compare(a.categoryId, b.categoryId))
  policy.usedTimes.sort((a, b) => compare(a.categoryId, b.categoryId))
  for (const group of policy.rules) group.rules.sort((a, b) => compare(a.id, b.id))
  for (const group of policy.usedTimes) {
    group.times.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)))
    group.sessionDurations.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)))
  }
  for (const base of policy.categoryBase) {
    base.networks.sort((a, b) => compare(a.itemId, b.itemId))
    base.atw.sort((a, b) => a - b)
  }
  return policy
}

export async function getDesktopPolicy({ transaction, familyEntry, deviceId, serverCategoriesVersions, version = 1 }: {
  transaction: SimpleDatabaseTransaction
  familyEntry: FamilyEntry
  deviceId: string
  serverCategoriesVersions: ServerCategoryVersions
  version?: 1 | 2
}): Promise<ServerDesktopPolicy | undefined> {
  const { database, transaction: tx } = transaction.legacy
  const familyId = familyEntry.familyId
  const device = await database.device.findOne({ where: { familyId, deviceId }, transaction: tx })
  if (!device || !id(device.currentUserId)) return undefined
  const childId = device.currentUserId
  const child = await database.user.findOne({ where: { familyId, userId: childId }, transaction: tx })
  // User overlays/default categories/primary-device semantics are not implemented
  // by the desktop policy core yet. Do not project away these restrictions.
  if (!child || child.type !== 'child' || child.disableTimelimitsUntil !== '0' ||
    child.blockedTimes !== '' || child.categoryForNotAssignedApps !== '' ||
    child.flags !== '0' || (!child.relaxPrimaryDeviceRule && child.currentDevice !== deviceId)) return undefined
  const categories = await database.category.findAll({
    where: { familyId, childId }, attributes: ['categoryId'], limit: MAX_ITEMS + 1, transaction: tx,
  })
  if (categories.length > MAX_ITEMS) return undefined
  const categoryIds = categories.map((item) => item.categoryId)
  const rows = await database.desktopAssignment.findAll({
    where: { familyId, deviceId }, limit: MAX_ITEMS + 1, transaction: tx,
  })
  if (rows.length > MAX_ITEMS) return undefined
  const common = { transaction, familyEntry, serverCategoriesVersions }
  return boundDesktopPolicy({
    ...(version === 2 ? { version: 2 as const, timeZone: child.timeZone, serverTimeMs: Date.now() } : { version: 1 as const }),
    deviceId, childId,
    categoryBase: await getCategoryBaseDatas({ ...common, categoryIdsToSyncBaseData: categoryIds }),
    assignments: rows.map(({ categoryId, platform, bundleId }) => ({ categoryId, platform, bundleId })),
    rules: await getRules({ ...common, categoryIdsToSyncRules: categoryIds }),
    usedTimes: await getUsedTimes({ ...common, categoryIdsToSyncUsedTimes: categoryIds, clientLevel: 2 }),
  })
}
