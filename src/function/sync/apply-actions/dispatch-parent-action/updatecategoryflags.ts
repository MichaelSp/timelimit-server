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

import { UpdateCategoryFlagsAction } from "../../../../action"
import { Cache } from "../cache"
import { IllegalStateException } from "../exception/illegal-state"
import { MissingCategoryException } from "../exception/missing-item"

export async function dispatchUpdateCategoryFlagsAction({
  action,
  cache,
}: {
  action: UpdateCategoryFlagsAction
  cache: Cache
}) {
  const categoryEntry = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.categoryId,
    },
    transaction: cache.transaction,
  })

  if (!categoryEntry) {
    throw new MissingCategoryException()
  }

  const oldFlags = parseInt(categoryEntry.flags, 10)

  if (!Number.isSafeInteger(oldFlags)) {
    throw new IllegalStateException({
      staticMessage: "oldFlags is not a safe integer",
    })
  }

  const newFlags = (oldFlags & ~action.modifiedBits) | action.newValues

  categoryEntry.flags = newFlags.toString(10)

  await categoryEntry.save({ transaction: cache.transaction })

  cache.categoriesWithModifiedBaseData.add(action.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
