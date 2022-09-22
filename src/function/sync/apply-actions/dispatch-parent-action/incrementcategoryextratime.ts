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

import { IncrementCategoryExtraTimeAction } from '../../../../action'
import { CategoryModel } from '../../../../database/category'
import { Cache } from '../cache'
import { MissingCategoryException } from '../exception/missing-item'
import { PremiumVersionMissingException } from '../exception/premium'

export async function dispatchIncrementCategoryExtraTime ({ action, cache }: {
  action: IncrementCategoryExtraTimeAction
  cache: Cache
}) {
  if (!cache.hasFullVersion) {
    throw new PremiumVersionMissingException()
  }

  async function handleCategory (category: CategoryModel) {
    if (action.day === category.extraTimeDay || category.extraTimeDay === -1) {
      category.extraTimeInMillis += action.addedExtraTime
    } else {
      category.extraTimeInMillis = action.addedExtraTime
    }

    category.extraTimeDay = action.day

    await category.save({ transaction: cache.transaction })

    cache.categoriesWithModifiedBaseData.add(category.categoryId)
    cache.incrementTriggeredSyncLevel(2)
  }

  const categoryEntry = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.categoryId
    },
    transaction: cache.transaction
  })

  if (!categoryEntry) {
    throw new MissingCategoryException()
  }

  await handleCategory(categoryEntry)

  if (categoryEntry.parentCategoryId !== '') {
    const parentCategoryEntry = await cache.database.category.findOne({
      where: {
        familyId: cache.familyId,
        categoryId: categoryEntry.parentCategoryId
      },
      transaction: cache.transaction
    })

    if (parentCategoryEntry) {
      await handleCategory(parentCategoryEntry)
    }
  }
}
