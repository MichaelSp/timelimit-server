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

import * as Sequelize from "sequelize"
import { Database } from "../../../database/index.js"
import { GetServerDataStatusIllegalStateException } from "./exception.js"

export interface FamilyEntry {
  familyId: string
  deviceListVersion: string
  userListVersion: string
  hasFullVersion: boolean
  fullVersionUntil: string
  u2fKeysVersion: string
}

export async function getFamilyEntry({
  database,
  familyId,
  transaction,
}: {
  database: Database
  familyId: string
  transaction: Sequelize.Transaction
}): Promise<FamilyEntry> {
  const familyEntryUnsafe = await database.family.findOne({
    where: {
      familyId,
    },
    attributes: [
      "deviceListVersion",
      "userListVersion",
      "hasFullVersion",
      "fullVersionUntil",
      "u2fKeysVersion",
    ],
    transaction,
  })

  if (!familyEntryUnsafe) {
    throw new GetServerDataStatusIllegalStateException({
      staticMessage: "could not find family entry",
    })
  }

  return {
    familyId,
    deviceListVersion: familyEntryUnsafe.deviceListVersion,
    userListVersion: familyEntryUnsafe.userListVersion,
    hasFullVersion: familyEntryUnsafe.hasFullVersion,
    fullVersionUntil: familyEntryUnsafe.fullVersionUntil,
    u2fKeysVersion: familyEntryUnsafe.u2fKeysVersion,
  }
}
