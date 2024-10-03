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

import { InternalServerError, Unauthorized } from "http-errors"
import { Database, Transaction } from "../../database"

export const requireFamilyEntry = async ({
  database,
  deviceAuthToken,
  transaction,
}: {
  database: Database
  deviceAuthToken: string
  transaction: Transaction
}) => {
  const deviceEntryUnsafe = await database.device.findOne({
    where: {
      deviceAuthToken,
    },
    attributes: ["familyId"],
    transaction,
  })

  if (!deviceEntryUnsafe) {
    throw new Unauthorized()
  }

  const deviceEntry = {
    familyId: deviceEntryUnsafe.familyId,
  }

  const familyEntryUnsafe = await database.family.findOne({
    where: {
      familyId: deviceEntry.familyId,
    },
    attributes: ["fullVersionUntil"],
    transaction,
  })

  if (!familyEntryUnsafe) {
    throw new InternalServerError()
  }

  const familyEntry = {
    fullVersionUntil: familyEntryUnsafe.fullVersionUntil,
  }

  return familyEntry
}
