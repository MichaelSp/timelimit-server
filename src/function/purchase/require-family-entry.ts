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

import { InternalServerError, Unauthorized } from 'http-errors'
import { SimpleDatabaseTransaction } from '../../database/simple'

export const requireFamilyEntry = async ({ transaction, deviceAuthToken }: {
  transaction: SimpleDatabaseTransaction
  deviceAuthToken: string
}) => {
  const deviceEntryUnsafe = await transaction.legacy.database.device.findOne({
    where: {
      deviceAuthToken,
    },
    attributes: ['familyId'],
    transaction: transaction.legacy.transaction
  })

  if (!deviceEntryUnsafe) {
    throw new Unauthorized()
  }

  const deviceEntry = {
    familyId: deviceEntryUnsafe.familyId,
  }

  const familyEntryUnsafe = await transaction.legacy.database.family.findOne({
    where: {
      familyId: deviceEntry.familyId,
    },
    attributes: ['fullVersionUntil', 'fullVersionDebts'],
    transaction: transaction.legacy.transaction
  })

  if (!familyEntryUnsafe) {
    throw new InternalServerError()
  }

  const familyEntry = {
    fullVersionUntil: familyEntryUnsafe.fullVersionUntil,
    fullVersionDebts: familyEntryUnsafe.fullVersionDebts,
  }

  return familyEntry
}
