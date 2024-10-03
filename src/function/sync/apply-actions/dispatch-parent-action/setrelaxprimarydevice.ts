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

import { SetRelaxPrimaryDeviceAction } from "../../../../action"
import { Cache } from "../cache"
import { MissingUserException } from "../exception/missing-item"

export async function dispatchSetRelaxPrimaryDevice({
  action,
  cache,
}: {
  action: SetRelaxPrimaryDeviceAction
  cache: Cache
}) {
  const oldUser = cache.database.user.findOne({
    transaction: cache.transaction,
    where: {
      familyId: cache.familyId,
      userId: action.userId,
      type: "child",
    },
  })

  if (!oldUser) {
    throw new MissingUserException()
  }

  await cache.database.user.update(
    {
      relaxPrimaryDeviceRule: action.relax,
    },
    {
      transaction: cache.transaction,
      where: {
        familyId: cache.familyId,
        userId: action.userId,
        type: "child",
      },
    },
  )

  cache.invalidiateUserList = true
  cache.incrementTriggeredSyncLevel(2)
}
