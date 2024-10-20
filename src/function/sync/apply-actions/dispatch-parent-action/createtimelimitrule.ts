/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2024 Jonas Lochmann
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

import { CreateTimeLimitRuleAction } from '../../../../action'
import { Cache } from '../cache'
import { MissingCategoryException } from '../exception/missing-item'
import { CanNotModifyOtherUsersBySelfLimitationException } from '../exception/self-limit'

export async function dispatchCreateTimeLimitRule ({ action, cache, fromChildSelfLimitAddChildUserId }: {
  action: CreateTimeLimitRuleAction
  cache: Cache
  fromChildSelfLimitAddChildUserId: string | null
}) {
  const categoryEntryUnsafe = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.rule.categoryId
    },
    transaction: cache.transaction,
    attributes: ['childId']
  })

  if (!categoryEntryUnsafe) {
    throw new MissingCategoryException()
  }

  if (fromChildSelfLimitAddChildUserId !== null) {
    if (fromChildSelfLimitAddChildUserId !== categoryEntryUnsafe.childId) {
      throw new CanNotModifyOtherUsersBySelfLimitationException()
    }
  }

  await cache.database.timelimitRule.create({
    familyId: cache.familyId,
    ruleId: action.rule.ruleId,
    categoryId: action.rule.categoryId,
    applyToExtraTimeUsage: action.rule.applyToExtraTimeUsage,
    maximumTimeInMillis: action.rule.maxTimeInMillis,
    dayMaskAsBitmask: action.rule.dayMask,
    startMinuteOfDay: action.rule.start,
    endMinuteOfDay: action.rule.end,
    sessionDurationMilliseconds: action.rule.sessionDurationMilliseconds,
    sessionPauseMilliseconds: action.rule.sessionPauseMilliseconds,
    perDay: action.rule.perDay ? 1 : 0,
    expiresAt: action.rule.expiresAt ? action.rule.expiresAt.toString() : null
  }, { transaction: cache.transaction })

  cache.categoriesWithModifiedTimeLimitRules.add(action.rule.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
