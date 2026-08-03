/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
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

import { SimpleDatabaseTransaction } from '../../database/simple'
import { randomWords } from '../../util/random-words'
import { generateIdWithinFamily } from '../../util/token'

export const createAddDeviceToken = async ({ familyId, transaction }: {
  familyId: string
  transaction: SimpleDatabaseTransaction
}) => {
  const token = randomWords(5)
  const deviceId = generateIdWithinFamily()

  await transaction.legacy.database.addDeviceToken.destroy({
    where: {
      familyId
    },
    transaction: transaction.legacy.transaction
  })

  await transaction.legacy.database.addDeviceToken.create({
    familyId,
    token: token.toLowerCase(),
    deviceId,
    createdAt: Date.now().toString()
  }, { transaction: transaction.legacy.transaction })

  return { token, deviceId }
}
