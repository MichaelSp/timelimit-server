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

import { DeleteTimeLimitRuleAction } from "../../../../action"
import { Cache } from "../cache"
import { MissingRuleException } from "../exception/missing-item"

export async function dispatchDeleteTimeLimitRule({
  action,
  cache,
}: {
  action: DeleteTimeLimitRuleAction
  cache: Cache
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

  await ruleEntry.destroy({ transaction: cache.transaction })

  cache.categoriesWithModifiedTimeLimitRules.add(ruleEntry.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
