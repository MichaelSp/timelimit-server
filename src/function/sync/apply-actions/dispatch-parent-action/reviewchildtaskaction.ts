/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2020 Jonas Lochmann
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

import { ReviewChildTaskAction } from '../../../../action'
import { Cache } from '../cache'
import { IllegalStateException } from '../exception/illegal-state'
import { MissingTaskException } from '../exception/missing-item'

export async function dispatchReviewChildTaskAction ({ action, cache }: {
  action: ReviewChildTaskAction
  cache: Cache
}) {
  const taskInfo = await cache.database.childTask.findOne({
    where: {
      familyId: cache.familyId,
      taskId: action.taskId
    },
    transaction: cache.transaction
  })

  if (taskInfo === null) throw new MissingTaskException()

  if (taskInfo.pendingRequest === 0) throw new IllegalStateException({ staticMessage: 'no task review pending' })

  if (action.ok) {
    const categoryInfoUnsafe = await cache.database.category.findOne({
      where: {
        familyId: cache.familyId,
        categoryId: taskInfo.categoryId
      },
      attributes: ['extraTimeInMillis', 'extraTimeDay'],
      transaction: cache.transaction
    })

    if (categoryInfoUnsafe === null) {
      throw new IllegalStateException({ staticMessage: 'category referenced from task not found' })
    }

    const categoryInfo = {
      extraTimeInMillis: categoryInfoUnsafe.extraTimeInMillis,
      extraTimeDay: categoryInfoUnsafe.extraTimeDay
    }

    if (categoryInfo.extraTimeDay !== 0 && categoryInfo.extraTimeInMillis > 0) {
      // if the current time is daily, then extend the daily time only
      await cache.database.category.update({
        extraTimeInMillis: categoryInfo.extraTimeInMillis + taskInfo.extraTimeDuration
      }, {
        where: {
          familyId: cache.familyId,
          categoryId: taskInfo.categoryId
        },
        transaction: cache.transaction
      })
    } else {
      await cache.database.category.update({
        extraTimeInMillis: categoryInfo.extraTimeInMillis + taskInfo.extraTimeDuration,
        extraTimeDay: -1
      }, {
        where: {
          familyId: cache.familyId,
          categoryId: taskInfo.categoryId
        },
        transaction: cache.transaction
      })
    }

    cache.categoriesWithModifiedBaseData.add(taskInfo.categoryId)

    await cache.database.childTask.update({
      pendingRequest: 0,
      lastGrantTimestamp: action.time.toString(10)
    }, {
      where: {
        familyId: cache.familyId,
        taskId: action.taskId
      },
      transaction: cache.transaction
    })
  } else {
    await cache.database.childTask.update({
      pendingRequest: 0
    }, {
      where: {
        familyId: cache.familyId,
        taskId: action.taskId
      },
      transaction: cache.transaction
    })
  }

  cache.categoriesWithModifiedTasks.add(taskInfo.categoryId)
}
