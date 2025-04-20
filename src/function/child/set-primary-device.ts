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

import { Conflict, InternalServerError, Unauthorized } from "http-errors"
import { config } from "../../config.js"
import { Database } from "../../database/index.js"
import { generateVersionId } from "../../util/token.js"
import { WebsocketApi } from "../../websocket/index.js"
import { notifyClientsAboutChangesDelayed } from "../websocket/index.js"

export const setPrimaryDevice = async ({
  database,
  websocket,
  deviceAuthToken,
  currentUserId,
  action,
}: {
  database: Database
  websocket: WebsocketApi
  deviceAuthToken: string
  currentUserId: string
  action: "set this device" | "unset this device"
  // no transaction here because this is directly called from an API endpoint
}): Promise<
  "assigned to other device" | "requires full version" | "success"
> => {
  return database.transaction(
    async (
      transaction,
    ): Promise<
      "assigned to other device" | "requires full version" | "success"
    > => {
      const deviceEntryUnsafe = await database.device.findOne({
        where: {
          deviceAuthToken,
        },
        transaction,
        attributes: ["familyId", "currentUserId", "deviceId"],
      })

      if (!deviceEntryUnsafe) {
        throw new Unauthorized()
      }

      const deviceEntry = {
        familyId: deviceEntryUnsafe.familyId,
        currentUserId: deviceEntryUnsafe.currentUserId,
        deviceId: deviceEntryUnsafe.deviceId,
      }

      if (deviceEntry.currentUserId !== currentUserId || currentUserId === "") {
        throw new Conflict()
      }

      const userEntryUnsafe = await database.user.findOne({
        where: {
          familyId: deviceEntry.familyId,
          userId: deviceEntry.currentUserId,
        },
        transaction,
        attributes: ["currentDevice"],
      })

      if (!userEntryUnsafe) {
        throw new Conflict()
      }

      const userEntry = {
        currentDevice: userEntryUnsafe.currentDevice,
      }

      const userDeviceEntriesUnsafe = await database.device.findAll({
        where: {
          familyId: deviceEntry.familyId,
          currentUserId,
        },
        transaction,
        attributes: ["deviceId"],
      })

      const userDeviceEntries = userDeviceEntriesUnsafe.map((item) => ({
        deviceId: item.deviceId,
      }))

      if (userDeviceEntries.length >= 2) {
        const familyEntryUnsafe = await database.family.findOne({
          where: {
            familyId: deviceEntry.familyId,
          },
          transaction,
          attributes: ["hasFullVersion"],
        })

        if (!familyEntryUnsafe) {
          throw new Conflict()
        }

        const familyEntry = {
          hasFullVersion: familyEntryUnsafe.hasFullVersion,
        }

        if (!(familyEntry.hasFullVersion || config.alwaysPro)) {
          return "requires full version"
        }
      }

      if (action === "set this device") {
        // check that no other device is selected
        if (
          userDeviceEntries.find(
            (item) => item.deviceId === userEntry.currentDevice,
          )
        ) {
          return "assigned to other device"
        }

        // update
        const [affectedRows] = await database.user.update(
          {
            currentDevice: deviceEntry.deviceId,
          },
          {
            where: {
              familyId: deviceEntry.familyId,
              userId: currentUserId,
            },
            transaction,
          },
        )

        if (affectedRows !== 1) {
          throw new Conflict()
        }
      } else if (action === "unset this device") {
        if (userEntry.currentDevice !== deviceEntry.deviceId) {
          throw new Conflict()
        }

        // update
        const [affectedRows] = await database.user.update(
          {
            currentDevice: "",
          },
          {
            where: {
              familyId: deviceEntry.familyId,
              userId: currentUserId,
            },
            transaction,
          },
        )

        if (affectedRows !== 1) {
          throw new Conflict()
        }
      } else {
        throw new InternalServerError("illegal state")
      }

      // invalidiate user list
      await database.family.update(
        {
          userListVersion: generateVersionId(),
        },
        {
          transaction,
          where: {
            familyId: deviceEntry.familyId,
          },
        },
      )

      // trigger sync
      await notifyClientsAboutChangesDelayed({
        familyId: deviceEntry.familyId,
        sourceDeviceId: deviceEntry.deviceId,
        websocket,
        database,
        generalLevel: 1, // the source device knows it already
        targetedLevels: new Map(),
        transaction,
      })

      return "success"
    },
  )
}
