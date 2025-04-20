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

import { difference } from "lodash"
import * as Sequelize from "sequelize"
import { Database } from "../../database/index.js"
import { deleteFamilies } from "./delete-families.js"

export async function deleteOldFamilies(database: Database) {
  const oldFamilyIds = await findOldFamilyIds(database)

  if (oldFamilyIds.length > 0) {
    const familyIdsToDelete = oldFamilyIds.slice(
      0,
      256,
    ) /* limit to 256 families per execution */

    await database.transaction(async (transaction) => {
      await deleteFamilies({
        database,
        transaction,
        familiyIds: familyIdsToDelete,
      })
    })
  }
}

export async function findOldFamilyIds(database: Database) {
  return database.transaction(async (transaction) => {
    const familyIdsWithExpiredLicenses = (
      await database.family.findAll({
        where: {
          fullVersionUntil: {
            [Sequelize.Op.lt]: (
              Date.now() -
              1000 * 60 * 60 * 24 * 90
            ) /* 90 days */
              .toString(10),
          },
        },
        attributes: ["familyId"],
        transaction,
      })
    ).map((item) => item.familyId)

    if (familyIdsWithExpiredLicenses.length === 0) {
      return []
    }

    const recentlyUsedFamilyIds = (
      await database.device.findAll({
        where: {
          familyId: {
            [Sequelize.Op.in]: familyIdsWithExpiredLicenses,
          },
          lastConnectivity: {
            [Sequelize.Op.gt]: (
              Date.now() -
              1000 * 60 * 60 * 24 * 90
            ) /* 90 days */
              .toString(10),
          },
        },
        attributes: ["familyId"],
        transaction,
      })
    ).map((item) => item.familyId)

    return difference(familyIdsWithExpiredLicenses, recentlyUsedFamilyIds)
  })
}
