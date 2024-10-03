/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2023 Jonas Lochmann
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
import { DeleteAccountPayload } from "../../api/schema"
import { Database } from "../../database"
import { sendAccountDeletedMail } from "../../util/mail"
import { WebsocketApi } from "../../websocket"
import { requireMailAndLocaleByAuthToken } from "../authentication"
import { deleteFamilies } from "./delete-families"

export async function deleteAccount({
  request,
  database,
  websocket,
}: {
  request: DeleteAccountPayload
  database: Database
  websocket: WebsocketApi
}) {
  await database.transaction(async (transaction) => {
    const deviceEntryUnsafe = await database.device.findOne({
      where: { deviceAuthToken: request.deviceAuthToken },
      attributes: ["familyId"],
      transaction,
    })

    if (!deviceEntryUnsafe) {
      throw new Unauthorized()
    }

    const deviceEntry = {
      familyId: deviceEntryUnsafe.familyId,
    }

    const userEntries = (
      await database.user.findAll({
        where: {
          familyId: deviceEntry.familyId,
          type: "parent",
        },
        attributes: ["mail"],
        transaction,
      })
    ).map((item) => ({ mail: item.mail }))

    const registeredMailAddresses = new Set<string>()

    userEntries.forEach((item) => {
      if (item.mail !== "") registeredMailAddresses.add(item.mail)
    })

    const authenticatedMailAddresses = new Set<string>()

    for (const mailAuthToken of request.mailAuthTokens) {
      const info = await requireMailAndLocaleByAuthToken({
        mailAuthToken,
        database,
        transaction,
        invalidate: true,
      })

      if (!registeredMailAddresses.has(info.mail)) throw new Unauthorized()

      authenticatedMailAddresses.add(info.mail)
    }

    if (registeredMailAddresses.size !== authenticatedMailAddresses.size)
      throw new Unauthorized()

    registeredMailAddresses.forEach((mail) => {
      if (!authenticatedMailAddresses.has(mail)) throw new Unauthorized()
    })

    const deviceEntries = (
      await database.device.findAll({
        where: {
          familyId: deviceEntry.familyId,
        },
        transaction,
        attributes: ["deviceAuthToken"],
      })
    ).map((item) => ({ deviceAuthToken: item.deviceAuthToken }))

    await deleteFamilies({
      database,
      transaction,
      familiyIds: [deviceEntry.familyId],
    })

    transaction.afterCommit(() => {
      for (const device of deviceEntries) {
        websocket.triggerSyncByDeviceAuthToken({
          deviceAuthToken: device.deviceAuthToken,
          isImportant: true,
        })
      }

      registeredMailAddresses.forEach((receiver) => {
        sendAccountDeletedMail({ receiver }).catch((ex) => {
          console.warn(
            "failure while sending account deletion confirmation",
            ex,
          )
        })
      })
    })
  })
}
