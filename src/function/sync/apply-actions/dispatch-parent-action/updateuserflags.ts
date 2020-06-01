/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 Jonas Lochmann
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

import { UpdateUserFlagsAction } from '../../../../action'
import { Cache } from '../cache'

export async function dispatchUpdateUserFlagsAction ({ action, cache }: {
  action: UpdateUserFlagsAction
  cache: Cache
}) {
  const userEntry = await cache.database.user.findOne({
    where: {
      familyId: cache.familyId,
      userId: action.userId
    },
    transaction: cache.transaction
  })

  if (!userEntry) {
    throw new Error('user not found')
  }

  const oldFlags = parseInt(userEntry.flags, 10)

  if (!Number.isSafeInteger(oldFlags)) {
    throw new Error()
  }

  const newFlags = (oldFlags & ~action.modifiedBits) | action.newValues

  userEntry.flags = newFlags.toString(10)

  await userEntry.save({ transaction: cache.transaction })

  cache.invalidiateUserList = true
}
