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

import { UpdateTimelimitRuleAction } from "../../../../action"
import { Cache } from "../cache"
import {
  MissingCategoryException,
  MissingRuleException,
} from "../exception/missing-item"
import {
  CanNotModifyOtherUsersBySelfLimitationException,
  CanNotRelaxRestrictionsSelfLimitException,
} from "../exception/self-limit"

export async function dispatchUpdateTimelimitRule({
  action,
  cache,
  fromChildSelfLimitAddChildUserId,
}: {
  action: UpdateTimelimitRuleAction
  cache: Cache
  fromChildSelfLimitAddChildUserId: string | null
}) {
  const ruleEntry = await cache.database.timelimitRule.findOne({
    where: {
      familyId: cache.familyId,
      ruleId: action.ruleId,
    },
    transaction: cache.transaction,
  })

  if (!ruleEntry) {
    throw new MissingRuleException()
  }

  if (fromChildSelfLimitAddChildUserId != null) {
    const categoryEntryUnsafe = await cache.database.category.findOne({
      where: {
        familyId: cache.familyId,
        categoryId: ruleEntry.categoryId,
      },
      transaction: cache.transaction,
      attributes: ["childId"],
    })

    if (!categoryEntryUnsafe) {
      throw new MissingCategoryException()
    }

    const categoryEntry = {
      childId: categoryEntryUnsafe.childId,
    }

    if (fromChildSelfLimitAddChildUserId !== categoryEntry.childId) {
      throw new CanNotModifyOtherUsersBySelfLimitationException()
    }

    const wasSessionDurationLimitationEnabled =
      ruleEntry.sessionPauseMilliseconds > 0 &&
      ruleEntry.sessionDurationMilliseconds > 0

    const countOldAffectedDays = Array(7)
      .fill(0)
      .reduce(
        (sum, _, index) => sum + ((ruleEntry.dayMaskAsBitmask >> index) & 1),
        0,
      )

    const isAtLeastAsStrictAsPreviously =
      action.maximumTimeInMillis <= ruleEntry.maximumTimeInMillis &&
      (action.dayMask & ruleEntry.dayMaskAsBitmask) ===
        ruleEntry.dayMaskAsBitmask &&
      (action.applyToExtraTimeUsage || !ruleEntry.applyToExtraTimeUsage) &&
      action.start <= ruleEntry.startMinuteOfDay &&
      action.end >= ruleEntry.endMinuteOfDay &&
      (!wasSessionDurationLimitationEnabled ||
        (action.sessionDurationMilliseconds <=
          ruleEntry.sessionDurationMilliseconds &&
          action.sessionPauseMilliseconds >=
            ruleEntry.sessionPauseMilliseconds)) &&
      (!action.perDay || ruleEntry.perDay || countOldAffectedDays <= 1)

    if (!isAtLeastAsStrictAsPreviously) {
      throw new CanNotRelaxRestrictionsSelfLimitException()
    }
  }

  ruleEntry.applyToExtraTimeUsage = action.applyToExtraTimeUsage
  ruleEntry.dayMaskAsBitmask = action.dayMask
  ruleEntry.maximumTimeInMillis = action.maximumTimeInMillis
  ruleEntry.startMinuteOfDay = action.start
  ruleEntry.endMinuteOfDay = action.end
  ruleEntry.sessionDurationMilliseconds = action.sessionDurationMilliseconds
  ruleEntry.sessionPauseMilliseconds = action.sessionPauseMilliseconds
  ruleEntry.perDay = action.perDay ? 1 : 0

  await ruleEntry.save({ transaction: cache.transaction })

  cache.categoriesWithModifiedTimeLimitRules.add(ruleEntry.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
