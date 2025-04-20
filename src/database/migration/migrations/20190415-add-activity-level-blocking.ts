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

import { Transaction } from "sequelize"
import { attributes as appActivityAttributes } from "../../appactivity.js"
import { attributesVersion9 as deviceAttributes } from "../../device.js"
import { Migration } from "../../main.js"

export const up: Migration = async ({ context }) => {
  const queryInterface = context.getQueryInterface()
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      await queryInterface.createTable("AppActivities", appActivityAttributes, {
        transaction,
      })
      await queryInterface.addColumn(
        "Devices",
        "activityLevelBlocking",
        {
          ...deviceAttributes.activityLevelBlocking,
        },
        {
          transaction,
        },
      )
    },
  )
}

export const down: Migration = async ({ context }) => {
  const queryInterface = context.getQueryInterface()
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      await queryInterface.dropTable("AppActivities", { transaction })
      await queryInterface.removeColumn("Devices", "activityLevelBlocking", {
        transaction,
      })
    },
  )
}
