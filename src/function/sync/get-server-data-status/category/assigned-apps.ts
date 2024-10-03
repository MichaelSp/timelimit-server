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

import * as Sequelize from "sequelize"
import { Database, Transaction } from "../../../../database"
import { ServerUpdatedCategoryAssignedApps } from "../../../../object/serverdatastatus"
import { FamilyEntry } from "../family-entry"
import { ServerCategoryVersions } from "./diff"

export async function getCategoryAssignedApps({
  database,
  transaction,
  categoryIdsToSyncAssignedApps,
  familyEntry,
  serverCategoriesVersions,
}: {
  database: Database
  transaction: Transaction
  categoryIdsToSyncAssignedApps: Array<string>
  familyEntry: FamilyEntry
  serverCategoriesVersions: ServerCategoryVersions
}): Promise<Array<ServerUpdatedCategoryAssignedApps>> {
  const dataForSyncing = (
    await database.categoryApp.findAll({
      where: {
        familyId: familyEntry.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoryIdsToSyncAssignedApps,
        },
      },
      attributes: ["categoryId", "packageName"],
      transaction,
    })
  ).map((item) => ({
    categoryId: item.categoryId,
    packageName: item.packageName,
  }))

  const getCategoryAssingedAppsVersion = (categoryId: string) =>
    serverCategoriesVersions.requireByCategoryId(categoryId).assignedAppsVersion

  return categoryIdsToSyncAssignedApps.map(
    (categoryId): ServerUpdatedCategoryAssignedApps => ({
      categoryId,
      apps: dataForSyncing
        .filter((item) => item.categoryId === categoryId)
        .map((item) => item.packageName),
      version: getCategoryAssingedAppsVersion(categoryId),
    }),
  )
}
