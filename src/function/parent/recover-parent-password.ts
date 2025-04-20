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
import {
  PlaintextParentPassword,
  assertPlaintextParentPasswordValid,
} from "../../api/schema.js"
import { Database } from "../../database/index.js"
import { sendPasswordRecoveryUsedMail } from "../../util/mail.js"
import { generateVersionId } from "../../util/token.js"
import { WebsocketApi } from "../../websocket/index.js"
import { requireMailAndLocaleByAuthToken } from "../authentication/index.js"
import { notifyClientsAboutChangesDelayed } from "../websocket/index.js"

export const recoverParentPassword = async ({
  database,
  websocket,
  password,
  mailAuthToken,
}: {
  database: Database
  websocket: WebsocketApi
  password: PlaintextParentPassword
  mailAuthToken: string
  // no transaction here because this is directly called from an API endpoint
}) => {
  assertPlaintextParentPasswordValid(password)

  await database.transaction(async (transaction) => {
    const mailInfo = await requireMailAndLocaleByAuthToken({
      mailAuthToken,
      database,
      transaction,
      invalidate: true,
    })

    // update the user entry
    const userEntry = await database.user.findOne({
      where: {
        mail: mailInfo.mail,
      },
      transaction,
    })

    if (!userEntry) {
      throw new Conflict()
    }

    userEntry.passwordHash = password.hash
    userEntry.secondPasswordHash = password.secondHash
    userEntry.secondPasswordSalt = password.secondSalt

    await userEntry.save({ transaction })

    // invalidate the user list
    await database.family.update(
      {
        userListVersion: generateVersionId(),
      },
      {
        where: {
          familyId: userEntry.familyId,
        },
        transaction,
      },
    )

    await notifyClientsAboutChangesDelayed({
      database,
      familyId: userEntry.familyId,
      websocket,
      generalLevel: 2,
      targetedLevels: new Map(),
      sourceDeviceId: null,
      transaction,
    })

    transaction.afterCommit(async () => {
      await sendPasswordRecoveryUsedMail({
        receiver: mailInfo.mail,
        locale: mailInfo.locale,
      })
    })
  })
}
