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

import { UpdateCategoryTitleAction } from "../../../../action"
import { Cache } from "../cache"
import { MissingCategoryException } from "../exception/missing-item"

export async function dispatchUpdateCategoryTitle({
  action,
  cache,
}: {
  action: UpdateCategoryTitleAction
  cache: Cache
}) {
  const oldCategory = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.categoryId,
    },
    transaction: cache.transaction,
  })

  if (!oldCategory) {
    throw new MissingCategoryException()
  }

  const [affectedRows] = await cache.database.category.update(
    {
      title: action.newTitle,
    },
    {
      where: {
        familyId: cache.familyId,
        categoryId: action.categoryId,
      },
      transaction: cache.transaction,
    },
  )

  if (affectedRows !== 0) {
    cache.categoriesWithModifiedBaseData.add(action.categoryId)
    cache.incrementTriggeredSyncLevel(2)
  }
}
