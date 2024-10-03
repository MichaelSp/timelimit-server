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

import { RenameChildAction } from "../../../../action"
import { Cache } from "../cache"
import { MissingUserException } from "../exception/missing-item"

export async function dispatchRenameChild({
  action,
  cache,
}: {
  action: RenameChildAction
  cache: Cache
}) {
  const oldItem = await cache.database.user.findOne({
    where: {
      familyId: cache.familyId,
      userId: action.childId,
      type: "child",
    },
    transaction: cache.transaction,
  })

  if (!oldItem) {
    throw new MissingUserException()
  }

  await cache.database.user.update(
    {
      name: action.newName,
    },
    {
      where: {
        familyId: cache.familyId,
        userId: action.childId,
        type: "child",
      },
      transaction: cache.transaction,
    },
  )

  cache.invalidiateUserList = true
  cache.doesUserExist.cache.set(action.childId, false)
  cache.incrementTriggeredSyncLevel(1)
}
