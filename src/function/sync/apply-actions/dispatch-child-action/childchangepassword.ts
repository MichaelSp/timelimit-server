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

import { ChildChangePasswordAction } from "../../../../action/index.js"
import { decryptParentPassword } from "../../../dh/index.js"
import { Cache } from "../cache.js"
import { SourceUserNotFoundException } from "../exception/illegal-state.js"

export const dispatchChildChangePassword = async ({
  action,
  childUserId,
  cache,
}: {
  action: ChildChangePasswordAction
  childUserId: string
  cache: Cache
}) => {
  const childEntry = await cache.database.user.findOne({
    where: {
      familyId: cache.familyId,
      userId: childUserId,
      type: "child",
    },
    transaction: cache.transaction,
  })

  if (!childEntry) {
    throw new SourceUserNotFoundException()
  }

  const newPassword = await decryptParentPassword({
    cache,
    password: action.password,
  })

  childEntry.passwordHash = newPassword.hash
  childEntry.secondPasswordSalt = newPassword.secondSalt
  childEntry.secondPasswordHash = newPassword.secondHash

  await childEntry.save({ transaction: cache.transaction })

  {
    const clear = cache.getSecondPasswordHashOfChild.cache.clear
    clear && clear()
  }

  cache.invalidiateUserList = true
  cache.incrementTriggeredSyncLevel(2)
}
