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

import * as Sequelize from 'sequelize'
import { SimpleDatabaseTransaction } from '../../../database/simple'
import { ClientDataStatusDevicesExtended } from '../../../object/clientdatastatus'
import { ServerExtendedDeviceData, ServerCryptContainer } from '../../../object/serverdatastatus'
import { FamilyEntry } from './family-entry'
import { types } from '../../../database/encryptedapplist'

export async function getDeviceDetailList ({
  transaction, familyEntry, devicesDetail, includeLegacyCryptoApps, includeDesktopInventory,
}: {
  transaction: SimpleDatabaseTransaction
  familyEntry: FamilyEntry
  devicesDetail: ClientDataStatusDevicesExtended
  includeLegacyCryptoApps: boolean
  includeDesktopInventory: boolean
}): Promise<Array<ServerExtendedDeviceData> | null> {
  const serverEncryptedAppsVersions = (await transaction.legacy.database.encryptedAppList.findAll({
    where: {
      familyId: familyEntry.familyId,
    },
    attributes: ['deviceId', 'type', 'version'],
    transaction: transaction.legacy.transaction
  })).filter((item) =>
    (includeLegacyCryptoApps && (item.type === types.base || item.type === types.diff)) ||
    (includeDesktopInventory && item.type === types.desktopInventory),
  ).map((item) => ({
    deviceId: item.deviceId,
    type: item.type,
    version: item.version,
  }))

  const devicesWithChangedBaseApps: Array<string> = []
  const devicesWithChangedDiffApps: Array<string> = []
  const devicesWithChangedDesktopInventory: Array<string> = []

  serverEncryptedAppsVersions.forEach((item) => {
    if (item.type === types.base) {
      if (
        !devicesDetail[item.deviceId] ||
        devicesDetail[item.deviceId].appsB !== item.version
      ) {
        devicesWithChangedBaseApps.push(item.deviceId)
      }
    } else if (item.type === types.diff) {
      if (
        !devicesDetail[item.deviceId] ||
        devicesDetail[item.deviceId].appsD !== item.version
      ) {
        devicesWithChangedDiffApps.push(item.deviceId)
      }
    } else if (item.type === types.desktopInventory) {
      if (
        !devicesDetail[item.deviceId] ||
        devicesDetail[item.deviceId].appsI !== item.version
      ) {
        devicesWithChangedDesktopInventory.push(item.deviceId)
      }
    }
  })

  const updatedDeviceIds = Array.from(
    new Set([
      ...devicesWithChangedBaseApps,
      ...devicesWithChangedDiffApps,
      ...devicesWithChangedDesktopInventory,
    ]),
  )

  if (updatedDeviceIds.length === 0) return null

  const updatedBaseApps = !includeLegacyCryptoApps || devicesWithChangedBaseApps.length === 0 ? [] : (await transaction.legacy.database.encryptedAppList.findAll({
    where: {
      familyId: familyEntry.familyId,
      deviceId: {
        [Sequelize.Op.in]: devicesWithChangedBaseApps
      },
      type: types.base
    },
    attributes: [
      'deviceId',
      'version',
      'data'
    ],
    transaction: transaction.legacy.transaction
  })).map((item) => ({
    deviceId: item.deviceId,
    version: item.version,
    data: item.data
  }))

  const updatedDiffApps = !includeLegacyCryptoApps || devicesWithChangedDiffApps.length === 0 ? [] : (await transaction.legacy.database.encryptedAppList.findAll({
    where: {
      familyId: familyEntry.familyId,
      deviceId: {
        [Sequelize.Op.in]: devicesWithChangedDiffApps
      },
      type: types.diff
    },
    attributes: [
      'deviceId',
      'version',
      'data'
    ],
    transaction: transaction.legacy.transaction
  })).map((item) => ({
    deviceId: item.deviceId,
    version: item.version,
    data: item.data
  }))

  const updatedDesktopInventory = !includeDesktopInventory || devicesWithChangedDesktopInventory.length === 0 ? [] : (await transaction.legacy.database.encryptedAppList.findAll({
    where: {
      familyId: familyEntry.familyId,
      deviceId: {
        [Sequelize.Op.in]: devicesWithChangedDesktopInventory
      },
      type: types.desktopInventory
    },
    attributes: [
      'deviceId',
      'version',
      'data'
    ],
    transaction: transaction.legacy.transaction
  })).map((item) => ({
    deviceId: item.deviceId,
    version: item.version,
    data: item.data
  }))

  return updatedDeviceIds.map((deviceId) => {
    const appsBase = updatedBaseApps.find((item) => item.deviceId === deviceId)
    const appsDiff = updatedDiffApps.find((item) => item.deviceId === deviceId)
    const desktopInventory = updatedDesktopInventory.find((item) => item.deviceId === deviceId)

    return {
      deviceId,
      ...(appsBase ? { appsBase: wrapServerCryptContainer(appsBase) } : {}),
      ...(appsDiff ? { appsDiff: wrapServerCryptContainer(appsDiff) } : {}),
      ...(desktopInventory ? { desktopInventory: wrapServerCryptContainer(desktopInventory) } : {}),
    }
  })
}

function wrapServerCryptContainer({
  version,
  data,
}: {
  version: string
  data: Buffer
}): ServerCryptContainer {
  return {
    version,
    data: data.toString("base64"),
  }
}
