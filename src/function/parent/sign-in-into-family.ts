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
import { NewDeviceInfo } from "../../api/schema.js"
import { Database } from "../../database/index.js"
import { EventHandler } from "../../monitoring/eventhandler.js"
import { createEmptyClientDataStatus } from "../../object/clientdatastatus.js"
import { ServerDataStatus } from "../../object/serverdatastatus.js"
import { sendDeviceLinkedMail } from "../../util/mail.js"
import {
  generateAuthToken,
  generateIdWithinFamily,
  generateVersionId,
} from "../../util/token.js"
import { WebsocketApi } from "../../websocket/index.js"
import { requireMailAndLocaleByAuthToken } from "../authentication/index.js"
import { prepareDeviceEntry } from "../device/prepare-device-entry.js"
import { generateServerDataStatus } from "../sync/get-server-data-status/index.js"
import { notifyClientsAboutChangesDelayed } from "../websocket/index.js"

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
