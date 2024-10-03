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

import {
  blockedTimesBitmaskLength,
  UpdateCategoryBlockedTimesAction,
} from "../../../../action/updatecategoryblockedtimes"
import { validateAndParseBitmask } from "../../../../util/bitmask"
import { Cache } from "../cache"
import { MissingCategoryException } from "../exception/missing-item"
import {
  CanNotModifyOtherUsersBySelfLimitationException,
  SelfLimitationException,
} from "../exception/self-limit"

export async function dispatchUpdateCategoryBlockedTimes({
  action,
  cache,
  fromChildSelfLimitAddChildUserId,
}: {
  action: UpdateCategoryBlockedTimesAction
  cache: Cache
  fromChildSelfLimitAddChildUserId: string | null
}) {
  const categoryEntryUnsafe = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.categoryId,
    },
    transaction: cache.transaction,
    attributes: ["childId", "blockedMinutesInWeek"],
  })

  if (!categoryEntryUnsafe) {
    throw new MissingCategoryException()
  }

  const categoryEntry = {
    childId: categoryEntryUnsafe.childId,
    blockedMinutesInWeek: categoryEntryUnsafe.blockedMinutesInWeek,
  }

  if (fromChildSelfLimitAddChildUserId !== null) {
    if (categoryEntry.childId !== fromChildSelfLimitAddChildUserId) {
      throw new CanNotModifyOtherUsersBySelfLimitationException()
    }

    const oldBlocked = validateAndParseBitmask(
      categoryEntry.blockedMinutesInWeek,
      blockedTimesBitmaskLength,
    )
    const newBlocked = validateAndParseBitmask(
      action.blockedTimes,
      blockedTimesBitmaskLength,
    )

    oldBlocked.forEach((value, index) => {
      if (value && !newBlocked[index]) {
        throw new SelfLimitationException({
          staticMessage: "new blocked time areas are smaller",
        })
      }
    })
  }

  await cache.database.category.update(
    {
      blockedMinutesInWeek: action.blockedTimes,
    },
    {
      where: {
        familyId: cache.familyId,
        categoryId: action.categoryId,
      },
      transaction: cache.transaction,
    },
  )

  cache.categoriesWithModifiedBaseData.add(action.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
