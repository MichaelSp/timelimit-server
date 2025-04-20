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

import { UpdateParentNotificationFlagsAction } from "../../../../action/index.js"
import { Cache } from "../cache.js"
import { MissingUserException } from "../exception/missing-item.js"

export async function dispatchUpdateParentNotificationFlags({
  action,
  cache,
}: {
  action: UpdateParentNotificationFlagsAction
  cache: Cache
}) {
  const parentEntry = await cache.database.user.findOne({
    where: {
      familyId: cache.familyId,
      userId: action.parentId,
      type: "parent",
    },
    transaction: cache.transaction,
  })

  if (!parentEntry) {
    throw new MissingUserException()
  }

  if (action.set) {
    parentEntry.mailNotificationFlags |= action.flags
  } else {
    parentEntry.mailNotificationFlags &= ~action.flags
  }

  await parentEntry.save({ transaction: cache.transaction })

  cache.invalidiateUserList = true
  cache.incrementTriggeredSyncLevel(1)
}
