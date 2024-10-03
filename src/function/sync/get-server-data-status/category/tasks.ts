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
import {
  ServerUpdatedCategoryTask,
  ServerUpdatedCategoryTasks,
} from "../../../../object/serverdatastatus"
import { FamilyEntry } from "../family-entry"
import { ServerCategoryVersions } from "./diff"

export async function getTasks({
  database,
  transaction,
  categoryIdsToSyncTasks,
  familyEntry,
  serverCategoriesVersions,
}: {
  database: Database
  transaction: Transaction
  categoryIdsToSyncTasks: Array<string>
  familyEntry: FamilyEntry
  serverCategoriesVersions: ServerCategoryVersions
}): Promise<Array<ServerUpdatedCategoryTasks>> {
  const dataToSync = (
    await database.childTask.findAll({
      where: {
        familyId: familyEntry.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoryIdsToSyncTasks,
        },
      },
      attributes: [
        "taskId",
        "categoryId",
        "taskTitle",
        "extraTimeDuration",
        "pendingRequest",
        "lastGrantTimestamp",
      ],
      transaction,
    })
  ).map((item) => ({
    taskId: item.taskId,
    categoryId: item.categoryId,
    taskTitle: item.taskTitle,
    extraTimeDuration: item.extraTimeDuration,
    pendingRequest: item.pendingRequest,
    lastGrantTimestamp: item.lastGrantTimestamp,
  }))

  return categoryIdsToSyncTasks.map((categoryId) => ({
    categoryId,
    version:
      serverCategoriesVersions.requireByCategoryId(categoryId).taskListVersion,
    tasks: dataToSync
      .filter((item) => item.categoryId === categoryId)
      .map(
        (item): ServerUpdatedCategoryTask => ({
          i: item.taskId,
          t: item.taskTitle,
          d: item.extraTimeDuration,
          p: item.pendingRequest !== 0,
          l: parseInt(item.lastGrantTimestamp, 10),
        }),
      ),
  }))
}
