/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2022 Jonas Lochmann
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

import { UpdateDeviceStatusAction } from '../../../../action'
import { DeviceHadManipulationFlags, DeviceManipulationFlags, hasDeviceManipulation } from '../../../../database/device'
import { newPermissionStatusValues } from '../../../../model/newpermissionstatus'
import { protetionLevels } from '../../../../model/protectionlevel'
import { runtimePermissionStatusValues } from '../../../../model/runtimepermissionstatus'
import { enumMax } from '../../../../util/enum'
import { sendManipulationWarnings } from '../../../warningmail/manipulation'
import { Cache } from '../cache'
import { SourceDeviceNotFoundException } from '../exception/illegal-state'

export async function dispatchUpdateDeviceStatus ({ deviceId, action, cache }: {
  deviceId: string
  action: UpdateDeviceStatusAction
  cache: Cache
}) {
  const deviceEntry = await cache.database.device.findOne({
    where: {
      familyId: cache.familyId,
      deviceId
    },
    transaction: cache.transaction
  })

  if (!deviceEntry) {
    throw new SourceDeviceNotFoundException()
  }

  const hadManipulationBefore = hasDeviceManipulation(deviceEntry)

  if (action.newProtetionLevel) {
    const hasChanged = deviceEntry.currentProtectionLevel !== action.newProtetionLevel

    deviceEntry.currentProtectionLevel = action.newProtetionLevel

    deviceEntry.highestProtectionLevel = enumMax(
      deviceEntry.currentProtectionLevel,
      deviceEntry.highestProtectionLevel,
      protetionLevels
    )

    if (hasChanged && (deviceEntry.currentProtectionLevel !== deviceEntry.highestProtectionLevel)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.ProtectionLevel
    }
  }

  if (action.newUsageStatsPermissionStatus) {
    const hasChanged = deviceEntry.currentUsageStatsPermission !== action.newUsageStatsPermissionStatus

    deviceEntry.currentUsageStatsPermission = action.newUsageStatsPermissionStatus

    deviceEntry.highestUsageStatsPermission = enumMax(
      deviceEntry.currentUsageStatsPermission,
      deviceEntry.highestUsageStatsPermission,
      runtimePermissionStatusValues
    )

    if (hasChanged && (deviceEntry.currentUsageStatsPermission !== deviceEntry.highestUsageStatsPermission)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.UsageStatsAccess
    }
  }

  if (action.newNotificationAccessPermission) {
    const hasChanged = deviceEntry.currentNotificationAccessPermission !== action.newNotificationAccessPermission

    deviceEntry.currentNotificationAccessPermission = action.newNotificationAccessPermission

    deviceEntry.highestNotificationAccessPermission = enumMax(
      deviceEntry.currentNotificationAccessPermission,
      deviceEntry.highestNotificationAccessPermission,
      newPermissionStatusValues
    )

    if (hasChanged && (deviceEntry.currentNotificationAccessPermission !== deviceEntry.highestNotificationAccessPermission)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.NotificationAccess
    }
  }

  if (action.newOverlayPermission) {
    const hasChanged = deviceEntry.currentOverlayPermission !== action.newOverlayPermission

    deviceEntry.currentOverlayPermission = action.newOverlayPermission

    deviceEntry.highestOverlayPermission = enumMax(
      deviceEntry.currentOverlayPermission,
      deviceEntry.highestOverlayPermission,
      runtimePermissionStatusValues
    )

    if (hasChanged && (deviceEntry.currentOverlayPermission !== deviceEntry.highestOverlayPermission)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.OverlayPermission
    }
  }

  if (action.newAccessibilityServiceEnabled !== undefined) {
    const hasChanged = deviceEntry.asEnabled !== action.newAccessibilityServiceEnabled

    deviceEntry.asEnabled = action.newAccessibilityServiceEnabled

    if (action.newAccessibilityServiceEnabled) {
      deviceEntry.wasAsEnabled = true
    }

    if (hasChanged && (deviceEntry.asEnabled !== deviceEntry.wasAsEnabled)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.AccessibiityService
    }
  }

  if (action.newAppVersion !== undefined) {
    const hasChanged = deviceEntry.currentAppVersion !== action.newAppVersion

    deviceEntry.currentAppVersion = action.newAppVersion

    deviceEntry.highestAppVersion = Math.max(
      deviceEntry.currentAppVersion,
      deviceEntry.highestAppVersion
    )

    if (hasChanged && (deviceEntry.currentAppVersion !== deviceEntry.highestAppVersion)) {
      deviceEntry.hadManipulation = true
      deviceEntry.hadManipulationFlags |= DeviceHadManipulationFlags.AppVersion
    }
  }

  if (action.didReboot) {
    deviceEntry.didReboot = true
  }

  if (action.isQOrLaterNow) {
    const hasChanged = deviceEntry.isQorLater === false

    if (hasChanged) {
      deviceEntry.isQorLater = true
    }
  }

  {
    const effectiveManipulationFlags = action.addedManipulationFlags & DeviceManipulationFlags.ALL

    if (effectiveManipulationFlags !== 0) {
      deviceEntry.manipulationFlags = deviceEntry.manipulationFlags | effectiveManipulationFlags
    }
  }

  await deviceEntry.save({ transaction: cache.transaction })

  if (hasDeviceManipulation(deviceEntry)) {
    if (!hadManipulationBefore) {
      await sendManipulationWarnings({
        database: cache.database,
        transaction: cache.transaction,
        deviceName: deviceEntry.name,
        familyId: cache.familyId
      })
    }
  }

  cache.invalidiateDeviceList = true
  cache.incrementTriggeredSyncLevel(1)
}
