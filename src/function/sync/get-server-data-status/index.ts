/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { config } from '../../../config'
import { SimpleDatabaseTransaction } from '../../../database/simple'
import { getStatusMessage } from '../../../function/statusmessage'
import { ClientDataStatus } from '../../../object/clientdatastatus'
import { ServerDataStatus } from '../../../object/serverdatastatus'
import { EventHandler } from '../../../monitoring/eventhandler'
import { getCampaign } from './campaign'
import {
  getCategoryAssignedApps, getCategoryBaseDatas, getCategoryDataToSync,
  getRules, getTasks, getUsedTimes
} from './category'
import { getDeviceDetailList } from './device-detail'
import { getDeviceList } from './device-list'
import { getDeviceDhKeys } from './dh-keys'
import { getFamilyEntry } from './family-entry'
import { getPings } from './pings'
import { getUserList } from './user-list'
import { getKeyRequests } from './key-requests'
import { getKeyResponses } from './key-responses'
import { getU2f } from './u2f'
import { getDesktopPolicy } from './desktop-policy'
import { types as keyRequestTypes } from '../../../database/keyrequest'
import { isDesktopBundleId } from '../../../database/desktopassignment'

export const generateServerDataStatus = async ({
  transaction, clientStatus, familyId, deviceId, eventHandler
}: {
  transaction: SimpleDatabaseTransaction
  clientStatus: ClientDataStatus
  familyId: string
  deviceId: string
  eventHandler: EventHandler
}): Promise<ServerDataStatus> => {
  const clientLevel = clientStatus.clientLevel || 0

  const familyEntry = await getFamilyEntry({ familyId, transaction })
  const doesClientSupportTasks = clientLevel >= 3
  const doesClientSupportCryptoApps = clientLevel >= 4
  const doesClientSupportDh = clientLevel >= 5
  const doesClientSupportU2f = clientLevel >= 6
  const doesClientSupportPing = clientLevel >= 7
  const doesClientSupportDesktopSync = clientStatus.desktopSync?.version === 1
  let doesClientSupportDesktopManagement = clientStatus.desktopManagement?.version === 1
  if (doesClientSupportDesktopManagement) {
    const requestingDevice = await transaction.legacy.database.device.findOne({
      attributes: ['platformType', 'currentUserId'],
      where: { familyId, deviceId },
      transaction: transaction.legacy.transaction,
    })
    const requestingUser = requestingDevice?.platformType === 'android' && requestingDevice.currentUserId
      ? await transaction.legacy.database.user.findOne({
        attributes: ['userId'],
        where: { familyId, userId: requestingDevice.currentUserId, type: 'parent' },
        transaction: transaction.legacy.transaction,
      })
      : null
    doesClientSupportDesktopManagement = Boolean(requestingUser)
  }
  const isClient750OrNewer = clientLevel >= 8 // first release in the post gplay time

  const message: string | undefined =
    await getStatusMessage({ transaction }) ||
    getCampaign({ familyId, isClient750OrNewer }) ||
    undefined

  const result: ServerDataStatus = {
    fullVersion: config.alwaysPro ? 1 : (
      familyEntry.hasFullVersion ? parseInt(familyEntry.fullVersionUntil, 10) : 0
    ),
    message,
    apiLevel: 9,
  }

  if (familyEntry.deviceListVersion !== clientStatus.devices) {
    result.devices = await getDeviceList({ transaction, familyEntry })
  }

  if (familyEntry.userListVersion !== clientStatus.users) {
    result.users = await getUserList({ transaction, familyEntry })
  }

  const categoryDataToSync = await getCategoryDataToSync({ transaction, familyEntry, categoriesStatus: clientStatus.categories })

  if (doesClientSupportDesktopSync) {
    result.desktopPolicy = await getDesktopPolicy({
      transaction, familyEntry, deviceId,
      serverCategoriesVersions: categoryDataToSync.serverCategoriesVersions,
      version: clientStatus.desktopPolicy?.version === 2 ? 2 : 1,
    })
  }

  if (doesClientSupportDesktopManagement) {
    const assignmentRows = await transaction.legacy.database.desktopAssignment.findAll({
      where: { familyId },
      attributes: ['deviceId', 'categoryId', 'platform', 'bundleId'],
      order: [['deviceId', 'ASC'], ['bundleId', 'ASC']],
      limit: 4097,
      transaction: transaction.legacy.transaction,
    })
    if (assignmentRows.length > 4096) throw new Error('desktop assignment snapshot exceeds supported limit')
    const seenAssignments = new Set<string>()
    result.desktopAssignments = assignmentRows.map((item) => {
      const key = `${item.deviceId}:${item.platform}:${item.bundleId}`
      if (item.platform !== 'macos' || !isDesktopBundleId(item.bundleId) || seenAssignments.has(key)) {
        throw new Error('desktop assignment snapshot contains invalid or duplicate rows')
      }
      seenAssignments.add(key)
      return ({
      deviceId: item.deviceId,
      categoryId: item.categoryId,
      platform: item.platform,
      bundleId: item.bundleId,
      })
    })
  }

  if (categoryDataToSync.removedCategoryIds.length > 0) {
    result.rmCategories = categoryDataToSync.removedCategoryIds
  }

  if (categoryDataToSync.categoryIdsToSyncBaseData.length > 0) {
    result.categoryBase = await getCategoryBaseDatas({
      transaction, familyEntry,
      categoryIdsToSyncBaseData: categoryDataToSync.categoryIdsToSyncBaseData
    })
  }

  if (categoryDataToSync.categoryIdsToSyncAssignedApps.length > 0) {
    result.categoryApp = await getCategoryAssignedApps({
      transaction, familyEntry,
      serverCategoriesVersions: categoryDataToSync.serverCategoriesVersions,
      categoryIdsToSyncAssignedApps: categoryDataToSync.categoryIdsToSyncAssignedApps
    })
  }

  if (categoryDataToSync.categoryIdsToSyncRules.length > 0) {
    result.rules = await getRules({
      transaction, familyEntry,
      serverCategoriesVersions: categoryDataToSync.serverCategoriesVersions,
      categoryIdsToSyncRules: categoryDataToSync.categoryIdsToSyncRules
    })
  }

  if (categoryDataToSync.categoryIdsToSyncUsedTimes.length > 0) {
    result.usedTimes = await getUsedTimes({
      transaction, familyEntry,
      serverCategoriesVersions: categoryDataToSync.serverCategoriesVersions,
      categoryIdsToSyncUsedTimes: categoryDataToSync.categoryIdsToSyncUsedTimes,
      clientLevel: clientStatus.clientLevel || null
    })
  }

  if (categoryDataToSync.categoryIdsToSyncTasks.length > 0 && doesClientSupportTasks) {
    result.tasks = await getTasks({
      transaction, familyEntry,
      serverCategoriesVersions: categoryDataToSync.serverCategoriesVersions,
      categoryIdsToSyncTasks: categoryDataToSync.categoryIdsToSyncTasks
    })
  }

  if (doesClientSupportCryptoApps || doesClientSupportDesktopSync || doesClientSupportDesktopManagement) {
    result.devices2 = await getDeviceDetailList({
      transaction,
      familyEntry,
      devicesDetail: clientStatus.devicesDetail || {},
      includeLegacyCryptoApps: doesClientSupportCryptoApps,
      includeDesktopInventory: doesClientSupportDesktopSync || doesClientSupportDesktopManagement,
    }) || undefined

  }

  if (doesClientSupportCryptoApps || doesClientSupportDesktopSync || doesClientSupportDesktopManagement) {
    result.krq = await getKeyRequests({
      transaction,
      familyEntry,
      deviceId,
      lastSeenRequestIndex: clientStatus.kri || null,
      requestTypes: doesClientSupportDesktopSync
        ? [keyRequestTypes.desktopInventory]
        : doesClientSupportDesktopManagement
          ? (doesClientSupportCryptoApps ? keyRequestTypes.legacy : [])
          : keyRequestTypes.legacy,
      targetDeviceOnly: doesClientSupportDesktopSync,
    }) || undefined
  }

  if (doesClientSupportCryptoApps) {
    result.kr = await getKeyResponses({
      transaction,
      familyEntry,
      deviceId,
      lastSeenRequestIndex: clientStatus.kr || null
    }) || undefined
  }

  if (doesClientSupportDh) {
    result.dh = await getDeviceDhKeys({
      transaction,
      familyEntry,
      deviceId,
      lastVersionId: clientStatus.dh || null,
      eventHandler
    }) || undefined
  }

  if (doesClientSupportU2f) {
    result.u2f = await getU2f({
      transaction,
      familyEntry,
      lastVersionId: clientStatus.u2f || null
    }) || undefined
  }

  if (doesClientSupportPing) {
    result.pings = await getPings({
      transaction,
      familyEntry,
      deviceId
    })
  }

  return result
}
