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

import { TriedDisablingDeviceAdminAction } from "../../../../action"
import { hasDeviceManipulation } from "../../../../database/device"
import { sendManipulationWarnings } from "../../../warningmail/manipulation"
import { Cache } from "../cache"
import { SourceDeviceNotFoundException } from "../exception/illegal-state"

export async function dispatchTriedDisablingDeviceAdmin({
  deviceId,
  cache,
}: {
  deviceId: string
  action: TriedDisablingDeviceAdminAction
  cache: Cache
}) {
  const deviceEntry = await cache.database.device.findOne({
    where: {
      familyId: cache.familyId,
      deviceId,
    },
    transaction: cache.transaction,
  })

  if (deviceEntry === null) {
    throw new SourceDeviceNotFoundException()
  }

  const hadManipulationBefore = hasDeviceManipulation(deviceEntry)

  if (!deviceEntry.triedDisablingDeviceAdmin) {
    deviceEntry.triedDisablingDeviceAdmin = true

    await deviceEntry.save({ transaction: cache.transaction })

    cache.invalidiateDeviceList = true
    cache.incrementTriggeredSyncLevel(1)
  }

  if (!hadManipulationBefore) {
    await sendManipulationWarnings({
      database: cache.database,
      transaction: cache.transaction,
      deviceName: deviceEntry.name,
      familyId: cache.familyId,
    })
  }
}
