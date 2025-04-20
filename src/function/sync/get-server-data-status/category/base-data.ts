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

import * as Sequelize from "sequelize"
import { Database, Transaction } from "../../../../database/index.js"
import { ServerUpdatedCategoryBaseData } from "../../../../object/serverdatastatus.js"
import { FamilyEntry } from "../family-entry.js"

export async function getCategoryBaseDatas({
  database,
  transaction,
  categoryIdsToSyncBaseData,
  familyEntry,
}: {
  database: Database
  transaction: Transaction
  categoryIdsToSyncBaseData: Array<string>
  familyEntry: FamilyEntry
}): Promise<Array<ServerUpdatedCategoryBaseData>> {
  const dataForSyncing = (
    await database.category.findAll({
      where: {
        familyId: familyEntry.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoryIdsToSyncBaseData,
        },
      },
      attributes: [
        "categoryId",
        "childId",
        "title",
        "blockedMinutesInWeek",
        "extraTimeInMillis",
        "extraTimeDay",
        "temporarilyBlocked",
        "baseVersion",
        "parentCategoryId",
        "blockAllNotifications",
        "timeWarningFlags",
        "minBatteryCharging",
        "minBatteryMobile",
        "temporarilyBlockedEndTime",
        "sort",
        "disableLimitsUntil",
        "flags",
        "blockNotificationDelay",
      ],
      transaction,
    })
  ).map((item) => ({
    categoryId: item.categoryId,
    childId: item.childId,
    title: item.title,
    blockedMinutesInWeek: item.blockedMinutesInWeek,
    extraTimeInMillis: item.extraTimeInMillis,
    extraTimeDay: item.extraTimeDay,
    temporarilyBlocked: item.temporarilyBlocked,
    baseVersion: item.baseVersion,
    parentCategoryId: item.parentCategoryId,
    blockAllNotifications: item.blockAllNotifications,
    timeWarningFlags: item.timeWarningFlags,
    minBatteryCharging: item.minBatteryCharging,
    minBatteryMobile: item.minBatteryMobile,
    temporarilyBlockedEndTime: item.temporarilyBlockedEndTime,
    sort: item.sort,
    disableLimitsUntil: item.disableLimitsUntil,
    flags: item.flags,
    blockNotificationDelay: item.blockNotificationDelay,
  }))

  const networkIdsForSyncing = (
    await database.categoryNetworkId.findAll({
      where: {
        familyId: familyEntry.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoryIdsToSyncBaseData,
        },
      },
      attributes: ["categoryId", "networkItemId", "hashedNetworkId"],
      transaction,
    })
  ).map((item) => ({
    categoryId: item.categoryId,
    networkItemId: item.networkItemId,
    hashedNetworkId: item.hashedNetworkId,
  }))

  const additionalTimeWarningsForSyncing = (
    await database.categoryTimeWarning.findAll({
      where: {
        familyId: familyEntry.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoryIdsToSyncBaseData,
        },
      },
      attributes: ["categoryId", "minutes"],
      transaction,
    })
  ).map((item) => ({
    categoryId: item.categoryId,
    minutes: item.minutes,
  }))

  return dataForSyncing.map(
    (item): ServerUpdatedCategoryBaseData => ({
      categoryId: item.categoryId,
      childId: item.childId,
      title: item.title,
      blockedTimes: item.blockedMinutesInWeek,
      extraTime: item.extraTimeInMillis,
      extraTimeDay: item.extraTimeDay,
      tempBlocked: item.temporarilyBlocked,
      version: item.baseVersion,
      parentCategoryId: item.parentCategoryId,
      blockAllNotifications: item.blockAllNotifications,
      timeWarnings: item.timeWarningFlags,
      mblMobile: item.minBatteryMobile,
      mblCharging: item.minBatteryCharging,
      tempBlockTime: parseInt(item.temporarilyBlockedEndTime, 10),
      sort: item.sort,
      networks: networkIdsForSyncing
        .filter((network) => network.categoryId === item.categoryId)
        .map((network) => ({
          itemId: network.networkItemId,
          hashedNetworkId: network.hashedNetworkId,
        })),
      dlu: parseInt(item.disableLimitsUntil, 10),
      flags: parseInt(item.flags, 10),
      blockNotificationDelay: parseInt(item.blockNotificationDelay, 10),
      atw: additionalTimeWarningsForSyncing
        .filter((timeWarning) => timeWarning.categoryId === item.categoryId)
        .map((timeWarning) => timeWarning.minutes),
    }),
  )
}
