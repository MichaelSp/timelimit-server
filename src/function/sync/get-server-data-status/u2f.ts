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
import { U2fData } from "../../../object/serverdatastatus.js"
import { FamilyEntry } from "./family-entry.js"

export async function getU2f({
  database,
  transaction,
  familyEntry,
  lastVersionId,
}: {
  database: Database
  transaction: Sequelize.Transaction
  familyEntry: FamilyEntry
  lastVersionId: string | null
}): Promise<U2fData | null> {
  if (lastVersionId === familyEntry.u2fKeysVersion) return null

  const savedData = await database.u2fKey.findAll({
    where: {
      familyId: familyEntry.familyId,
    },
    transaction,
  })

  return {
    v: familyEntry.u2fKeysVersion,
    d: savedData.map((item) => ({
      u: item.userId,
      a: parseInt(item.addedAt, 10),
      h: item.keyHandle.toString("base64"),
      p: item.publicKey.toString("base64"),
    })),
  }
}
