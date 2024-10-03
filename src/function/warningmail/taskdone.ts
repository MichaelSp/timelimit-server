/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2020 Jonas Lochmann
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

import { Database, Transaction } from "../../database"
import { mailNotificationFlags } from "../../database/user"
import { sendTaskDoneMail } from "../../util/mail"
import { canSendTaskDoneMail } from "../../util/ratelimit-taskdonemail"

export const sendTaskDoneMails = async ({
  database,
  familyId,
  childName,
  taskTitle,
  transaction,
}: {
  database: Database
  familyId: string
  childName: string
  taskTitle: string
  transaction: Transaction
}) => {
  const parentEntries = await database.user.findAll({
    where: {
      familyId,
      type: "parent",
    },
    transaction,
  })

  const targetMailAddresses = parentEntries
    .filter((item) => item.mail !== "")
    .filter(
      (item) =>
        (item.mailNotificationFlags & mailNotificationFlags.tasks) ===
        mailNotificationFlags.tasks,
    )
    .map((item) => item.mail)

  transaction.afterCommit(async () => {
    await Promise.all(
      targetMailAddresses.map(async (receiver) => {
        if (await canSendTaskDoneMail(receiver)) {
          await sendTaskDoneMail({
            receiver,
            child: childName,
            task: taskTitle,
          })
        }
      }),
    )
  })
}
