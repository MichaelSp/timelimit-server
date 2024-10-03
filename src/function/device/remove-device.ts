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

import { Conflict } from "http-errors"
import { Database, Transaction } from "../../database"
import { generateVersionId } from "../../util/token"
import { WebsocketApi } from "../../websocket"
import { notifyClientsAboutChangesDelayed } from "../websocket"

export async function removeDevice({
  database,
  familyId,
  deviceId,
  websocket,
  transaction,
}: {
  database: Database
  familyId: string
  deviceId: string
  websocket: WebsocketApi
  transaction: Transaction
}) {
  const deviceEntry = await database.device.findOne({
    where: {
      familyId,
      deviceId,
    },
    transaction,
  })

  if (!deviceEntry) {
    throw new Conflict()
  }

  // remove as current device
  await database.user.update(
    {
      currentDevice: "",
    },
    {
      where: {
        familyId,
        currentDevice: deviceId,
      },
      transaction,
    },
  )

  // add to old devices if it is not yet there (it could be there if it reported a uninstall)
  const oldOldDeviceEntry = await database.oldDevice.findOne({
    where: {
      deviceAuthToken: deviceEntry.deviceAuthToken,
    },
    transaction,
  })

  if (!oldOldDeviceEntry) {
    await database.oldDevice.create(
      {
        deviceAuthToken: deviceEntry.deviceAuthToken,
      },
      {
        transaction,
      },
    )
  }

  // remove from the device list
  await deviceEntry.destroy({ transaction })

  // invalidiate the caches
  await database.family.update(
    {
      deviceListVersion: generateVersionId(),
      // the device could have become unassigned during this
      userListVersion: generateVersionId(),
    },
    {
      where: {
        familyId: deviceEntry.familyId,
      },
      transaction,
    },
  )

  await notifyClientsAboutChangesDelayed({
    database,
    websocket,
    familyId,
    sourceDeviceId: null,
    generalLevel: 1,
    targetedLevels: new Map(),
    transaction,
  })

  transaction.afterCommit(() => {
    websocket.triggerSyncByDeviceAuthToken({
      deviceAuthToken: deviceEntry.deviceAuthToken,
      isImportant: true,
    })
  })
}
