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

import { UpdateCategoryBatteryLimitAction } from "../../../../action"
import { Cache } from "../cache"
import { MissingCategoryException } from "../exception/missing-item"

export async function dispatchUpdateCategoryBatteryLimit({
  action,
  cache,
}: {
  action: UpdateCategoryBatteryLimitAction
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

  if (action.chargeLimit !== undefined) {
    categoryEntry.minBatteryCharging = action.chargeLimit
  }

  if (action.mobileLimit !== undefined) {
    categoryEntry.minBatteryMobile = action.mobileLimit
  }

  await categoryEntry.save({ transaction: cache.transaction })

  cache.categoriesWithModifiedBaseData.add(action.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
