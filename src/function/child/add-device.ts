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

import { Unauthorized } from "http-errors"
import { RegisterChildDeviceRequest } from "../../api/schema.js"
import { Database } from "../../database/index.js"
import { EventHandler } from "../../monitoring/eventhandler.js"
import { createEmptyClientDataStatus } from "../../object/clientdatastatus.js"
import { ServerDataStatus } from "../../object/serverdatastatus.js"
import { generateAuthToken, generateVersionId } from "../../util/token.js"
import { WebsocketApi } from "../../websocket/index.js"
import { prepareDeviceEntry } from "../device/prepare-device-entry.js"
import { generateServerDataStatus } from "../sync/get-server-data-status/index.js"
import { notifyClientsAboutChangesDelayed } from "../websocket/index.js"

export const addChildDevice = async ({
  database,
  eventHandler,
  websocket,
  request,
}: {
  database: Database
  eventHandler: EventHandler
  websocket: WebsocketApi
  request: RegisterChildDeviceRequest
  // no transaction here because this is directly called from an API endpoint
}): Promise<{
  deviceId: string
  deviceAuthToken: string
  data: ServerDataStatus
}> => {
  return database.transaction(async (transaction) => {
    const entry = await database.addDeviceToken.findOne({
      where: {
        token: request.registerToken.toLowerCase(),
      },
      transaction,
    })

    if (!entry) {
      throw new Unauthorized()
    }

    await entry.destroy({ transaction })

    const { deviceId, familyId } = entry
    const deviceAuthToken = generateAuthToken()

    await database.device.create(
      prepareDeviceEntry({
        familyId,
        deviceId,
        deviceAuthToken,
        deviceName: request.deviceName,
        newDeviceInfo: request.childDevice,
        userId: "",
        isUserKeptSignedIn: false,
      }),
      { transaction },
    )

    await database.family.update(
      {
        deviceListVersion: generateVersionId(),
      },
      {
        where: {
          familyId,
        },
        transaction,
      },
    )

    await notifyClientsAboutChangesDelayed({
      familyId,
      websocket,
      database,
      generalLevel: 1,
      targetedLevels: new Map(),
      sourceDeviceId: deviceId,
      transaction,
    })

    const data = await generateServerDataStatus({
      database,
      clientStatus: createEmptyClientDataStatus({
        clientLevel: request.clientLevel || null,
      }),
      familyId: entry.familyId,
      deviceId,
      transaction,
      eventHandler,
    })

    return {
      deviceId,
      deviceAuthToken,
      data,
    }
  })
}
