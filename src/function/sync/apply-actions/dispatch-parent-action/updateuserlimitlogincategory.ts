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

import { UpdateUserLimitLoginCategory } from "../../../../action"
import { Cache } from "../cache"
import { ApplyActionException } from "../exception/index"
import {
  MissingCategoryException,
  MissingUserException,
} from "../exception/missing-item"

export async function dispatchUpdateUserLimitLoginCategoryAction({
  action,
  cache,
  parentUserId,
}: {
  action: UpdateUserLimitLoginCategory
  cache: Cache
  parentUserId: string
}) {
  const userEntry = await cache.database.user.findOne({
    where: {
      familyId: cache.familyId,
      userId: action.userId,
      type: "parent",
    },
    transaction: cache.transaction,
  })

  if (!userEntry) {
    throw new MissingUserException()
  }

  if (action.categoryId !== undefined && parentUserId !== action.userId) {
    throw new ApplyActionException({
      staticMessage:
        "only the parent user itself can add a limit login category",
    })
  }

  await cache.database.userLimitLoginCategory.destroy({
    where: {
      familyId: cache.familyId,
      userId: action.userId,
    },
    transaction: cache.transaction,
  })

  if (action.categoryId !== undefined) {
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

    await cache.database.userLimitLoginCategory.create(
      {
        familyId: cache.familyId,
        userId: action.userId,
        categoryId: action.categoryId,
        preBlockDuration: 0,
      },
      {
        transaction: cache.transaction,
      },
    )
  }

  cache.invalidiateUserList = true
  cache.incrementTriggeredSyncLevel(2)
}
