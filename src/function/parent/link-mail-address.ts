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

import { Conflict, Unauthorized } from "http-errors"
import { Database } from "../../database/index.js"
import { generateVersionId } from "../../util/token.js"
import { WebsocketApi } from "../../websocket/index.js"
import { requireMailAndLocaleByAuthToken } from "../authentication/index.js"
import { notifyClientsAboutChangesDelayed } from "../websocket/index.js"

export const linkMailAddress = async ({
  mailAuthToken,
  deviceAuthToken,
  parentUserId,
  parentPasswordSecondHash,
  database,
  websocket,
}: {
  mailAuthToken: string
  deviceAuthToken: string
  parentUserId: string
  parentPasswordSecondHash: string
  database: Database
  websocket: WebsocketApi
  // no transaction here because this is directly called from an API endpoint
}) => {
  await database.transaction(async (transaction) => {
    const deviceEntry = await database.device.findOne({
      where: {
        deviceAuthToken,
      },
      transaction,
    })

    if (!deviceEntry) {
      throw new Unauthorized()
    }

    const familyId = deviceEntry.familyId

    const mailInfo = await requireMailAndLocaleByAuthToken({
      mailAuthToken,
      database,
      transaction,
      invalidate: true,
    })

    const exisitingUser = await database.user.findOne({
      where: {
        mail: mailInfo.mail,
      },
      transaction,
    })

    if (exisitingUser) {
      throw new Conflict()
    }

    const parentEntry = await database.user.findOne({
      where: {
        type: "parent",
        familyId,
        userId: parentUserId,
      },
      transaction,
    })

    if (!parentEntry) {
      throw new Conflict()
    }

    if (parentEntry.mail !== "") {
      throw new Conflict()
    }

    if (parentEntry.secondPasswordHash !== parentPasswordSecondHash) {
      throw new Conflict()
    }

    if (!parentEntry.secondPasswordSalt) {
      throw new Conflict()
    }

    parentEntry.mail = mailInfo.mail

    await parentEntry.save({ transaction })

    // invalidiate client caches
    await database.family.update(
      {
        userListVersion: generateVersionId(),
      },
      {
        where: {
          familyId,
        },
        transaction,
      },
    )

    // notify
    await notifyClientsAboutChangesDelayed({
      familyId,
      sourceDeviceId: null,
      generalLevel: 1,
      targetedLevels: new Map(),
      database,
      websocket,
      transaction,
    })
  })
}
