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

import * as Sequelize from 'sequelize'
import { Database, Transaction } from '../../../../database'
import { ServerUpdatedTimeLimitRules } from '../../../../object/serverdatastatus'
import { FamilyEntry } from '../family-entry'
import { ServerCategoryVersions } from './diff'

export async function getRules ({ database, transaction, categoryIdsToSyncRules, familyEntry, serverCategoriesVersions }: {
  database: Database
  transaction: Transaction
  categoryIdsToSyncRules: Array<string>
  familyEntry: FamilyEntry
  serverCategoriesVersions: ServerCategoryVersions
}): Promise<Array<ServerUpdatedTimeLimitRules>> {
  const dataForSyncing = (await database.timelimitRule.findAll({
    where: {
      familyId: familyEntry.familyId,
      categoryId: {
        [Sequelize.Op.in]: categoryIdsToSyncRules
      }
    },
    attributes: [
      'ruleId',
      'categoryId',
      'applyToExtraTimeUsage',
      'maximumTimeInMillis',
      'dayMaskAsBitmask',
      'startMinuteOfDay',
      'endMinuteOfDay',
      'sessionDurationMilliseconds',
      'sessionPauseMilliseconds',
      'perDay',
      'expiresAt'
    ],
    transaction
  })).map((item) => ({
    ruleId: item.ruleId,
    categoryId: item.categoryId,
    applyToExtraTimeUsage: item.applyToExtraTimeUsage,
    maximumTimeInMillis: item.maximumTimeInMillis,
    dayMaskAsBitmask: item.dayMaskAsBitmask,
    startMinuteOfDay: item.startMinuteOfDay,
    endMinuteOfDay: item.endMinuteOfDay,
    sessionDurationMilliseconds: item.sessionDurationMilliseconds,
    sessionPauseMilliseconds: item.sessionPauseMilliseconds,
    perDay: item.perDay,
    expiresAt: item.expiresAt ? parseInt(item.expiresAt, 10) : undefined
  }))

  const getCategoryRulesVersion = (categoryId: string) => (
    serverCategoriesVersions.requireByCategoryId(categoryId).timeLimitRulesVersion
  )

  return categoryIdsToSyncRules.map((categoryId): ServerUpdatedTimeLimitRules => ({
    categoryId,
    rules: dataForSyncing.filter((item) => item.categoryId === categoryId).map((item) => ({
      id: item.ruleId,
      extraTime: item.applyToExtraTimeUsage,
      dayMask: item.dayMaskAsBitmask,
      maxTime: item.maximumTimeInMillis,
      start: item.startMinuteOfDay,
      end: item.endMinuteOfDay,
      session: item.sessionDurationMilliseconds,
      pause: item.sessionPauseMilliseconds,
      perDay: item.perDay !== 0 ? true : false,
      e: item.expiresAt
    })),
    version: getCategoryRulesVersion(categoryId)
  }))
}
