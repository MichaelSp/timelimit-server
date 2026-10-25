import { SetDesktopAppCategoryAction } from "../../../../action/index.js"
import { isDesktopBundleId } from "../../../../database/desktopassignment.js"
import { Cache } from "../cache.js"
import { ApplyActionException } from "../exception/index.js"
import { MissingCategoryException, MissingDeviceException, MissingUserException } from "../exception/missing-item.js"

export async function dispatchSetDesktopAppCategory({ action, cache }: {
  action: SetDesktopAppCategoryAction
  cache: Cache
}) {
  if (!isDesktopBundleId(action.bundleId)) throw new ApplyActionException({ staticMessage: "invalid desktop bundle identity" })
  const device = await cache.transaction.legacy.database.device.findOne({
    attributes: ['platformType', 'platformLevel', 'currentUserId'],
    where: { familyId: cache.familyId, deviceId: action.deviceId },
    transaction: cache.transaction.legacy.transaction,
  })
  if (!device) throw new MissingDeviceException()
  if (device.platformType !== 'desktop' || device.platformLevel < 1 || device.currentUserId !== action.childId) {
    throw new ApplyActionException({ staticMessage: "desktop assignment target is stale or unsupported" })
  }
  const child = await cache.transaction.legacy.database.user.findOne({
    attributes: ['userId'],
    where: { familyId: cache.familyId, userId: action.childId, type: 'child' },
    transaction: cache.transaction.legacy.transaction,
  })
  if (!child) throw new MissingUserException()

  if (action.categoryId === '') {
    await cache.transaction.legacy.database.desktopAssignment.destroy({
      where: { familyId: cache.familyId, deviceId: action.deviceId, platform: 'macos', bundleId: action.bundleId },
      transaction: cache.transaction.legacy.transaction,
    })
  } else {
    const category = await cache.transaction.legacy.database.category.findOne({
      attributes: ['categoryId', 'childId'],
      where: { familyId: cache.familyId, categoryId: action.categoryId },
      transaction: cache.transaction.legacy.transaction,
    })
    if (!category || category.childId !== action.childId) throw new MissingCategoryException()
    const database = cache.transaction.legacy.database
    const transaction = cache.transaction.legacy.transaction
    // Lock the family row as a per-family mutex so concurrent new assignments
    // cannot both observe free capacity and persist an oversized snapshot.
    const updateLock = transaction.LOCK?.UPDATE
    await database.family.findOne({
      attributes: ['familyId'],
      where: { familyId: cache.familyId },
      ...(updateLock ? { lock: updateLock } : {}),
      transaction,
    })
    const existing = await database.desktopAssignment.findOne({
      attributes: ['deviceId'],
      where: { familyId: cache.familyId, deviceId: action.deviceId, platform: 'macos', bundleId: action.bundleId },
      transaction,
    })
    if (!existing) {
      const assignments = await database.desktopAssignment.findAll({
        attributes: ['deviceId'],
        where: { familyId: cache.familyId },
        limit: 4097,
        transaction,
      })
      if (assignments.length >= 4096) throw new ApplyActionException({ staticMessage: 'desktop assignment limit reached' })
    }
    // categoryId participates in the composite key, so remove the previous
    // category mapping first to make a reassignment replace, not duplicate, it.
    await cache.transaction.legacy.database.desktopAssignment.destroy({
      where: { familyId: cache.familyId, deviceId: action.deviceId, platform: 'macos', bundleId: action.bundleId },
      transaction: cache.transaction.legacy.transaction,
    })
    await cache.transaction.legacy.database.desktopAssignment.upsert({
      familyId: cache.familyId, deviceId: action.deviceId, categoryId: action.categoryId,
      platform: 'macos', bundleId: action.bundleId,
    }, { transaction: cache.transaction.legacy.transaction })
  }
  cache.incrementTriggeredSyncLevel(2)
}
