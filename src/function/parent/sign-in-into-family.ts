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
import { NewDeviceInfo } from "../../api/schema"
import { Database } from "../../database"
import { EventHandler } from "../../monitoring/eventhandler"
import { createEmptyClientDataStatus } from "../../object/clientdatastatus"
import { ServerDataStatus } from "../../object/serverdatastatus"
import { sendDeviceLinkedMail } from "../../util/mail"
import {
  generateAuthToken,
  generateIdWithinFamily,
  generateVersionId,
} from "../../util/token"
import { WebsocketApi } from "../../websocket"
import { requireMailAndLocaleByAuthToken } from "../authentication"
import { prepareDeviceEntry } from "../device/prepare-device-entry"
import { generateServerDataStatus } from "../sync/get-server-data-status"
import { notifyClientsAboutChangesDelayed } from "../websocket"

export const signInIntoFamily = async ({
  database,
  eventHandler,
  mailAuthToken,
  newDeviceInfo,
  deviceName,
  websocket,
  clientLevel,
}: {
  database: Database
  eventHandler: EventHandler
  mailAuthToken: string
  newDeviceInfo: NewDeviceInfo
  deviceName: string
  websocket: WebsocketApi
  clientLevel: number | null
  // no transaction here because this is directly called from an API endpoint
}): Promise<{
  deviceId: string
  deviceAuthToken: string
  data: ServerDataStatus
}> => {
  return database.transaction(async (transaction) => {
    const mailInfo = await requireMailAndLocaleByAuthToken({
      database,
      mailAuthToken,
      transaction,
      invalidate: true,
    })

    const userEntryUnsafe = await database.user.findOne({
      where: {
        mail: mailInfo.mail,
      },
      attributes: ["familyId", "userId"],
      transaction,
    })

    if (!userEntryUnsafe) {
      throw new Conflict()
    }

    const userEntry = {
      familyId: userEntryUnsafe.familyId,
      userId: userEntryUnsafe.userId,
    }

    const deviceAuthToken = generateAuthToken()
    const deviceId = generateIdWithinFamily()

    await database.device.create(
      prepareDeviceEntry({
        familyId: userEntry.familyId,
        deviceId,
        userId: userEntry.userId,
        deviceName,
        deviceAuthToken,
        newDeviceInfo,
        isUserKeptSignedIn: true,
      }),
      { transaction },
    )

    // notify about changes
    await database.family.update(
      {
        deviceListVersion: generateVersionId(),
      },
      {
        where: {
          familyId: userEntry.familyId,
        },
        transaction,
      },
    )

    await notifyClientsAboutChangesDelayed({
      familyId: userEntry.familyId,
      websocket,
      database,
      generalLevel: 1,
      targetedLevels: new Map(),
      sourceDeviceId: deviceId,
      transaction,
    })

    transaction.afterCommit(async () => {
      await sendDeviceLinkedMail({
        receiver: mailInfo.mail,
        locale: mailInfo.locale,
        deviceName,
      })
    })

    const data = await generateServerDataStatus({
      database,
      clientStatus: createEmptyClientDataStatus({ clientLevel }),
      familyId: userEntry.familyId,
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
