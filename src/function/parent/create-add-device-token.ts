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

import { Database, Transaction } from "../../database/index.js"
import { randomWords } from "../../util/random-words.js"
import { generateIdWithinFamily } from "../../util/token.js"

export const createAddDeviceToken = async ({
  familyId,
  database,
  transaction,
}: {
  familyId: string
  database: Database
  transaction: Transaction
}) => {
  const token = randomWords(5)
  const deviceId = generateIdWithinFamily()

  await database.addDeviceToken.destroy({
    where: {
      familyId,
    },
    transaction,
  })

  await database.addDeviceToken.create(
    {
      familyId,
      token: token.toLowerCase(),
      deviceId,
      createdAt: Date.now().toString(),
    },
    { transaction },
  )

  return { token, deviceId }
}
