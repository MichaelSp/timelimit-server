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

import { Transaction } from "sequelize"
import { attributes as addDeviceTokenAttributes } from "../../adddevicetoken"
import { attributes as appAttributes } from "../../app"
import { attributesVersion1 as authTokenAttributes } from "../../authtoken"
import { attributesVersion1 as categoryAttributes } from "../../category"
import { attributes as categoryAppAttributes } from "../../categoryapp"
import { attributesVersion1 as deviceAttributes } from "../../device"
import { attributesVersion1 as familyAttributes } from "../../family"
import { Migration } from "../../main"
import { attributes as purchaseAttributes } from "../../purchase"
import { attributesVersion1 as timelimitruleAttributes } from "../../timelimitrule"
import { attributesVersion1 as usedTimeAttribute } from "../../usedtime"
import { attributesVersion1 as userAttributes } from "../../user"

export const up: Migration = async ({ context }) => {
  const queryInterface = context.getQueryInterface()
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      await queryInterface.createTable(
        "AddDeviceTokens",
        addDeviceTokenAttributes,
        { transaction },
      )
      await queryInterface.createTable("Apps", appAttributes, { transaction })
      await queryInterface.createTable("AuthTokens", authTokenAttributes, {
        transaction,
      })
      await queryInterface.createTable("Categories", categoryAttributes, {
        transaction,
      })
      await queryInterface.createTable("CategoryApps", categoryAppAttributes, {
        transaction,
      })
      await queryInterface.createTable("Devices", deviceAttributes, {
        transaction,
      })
      await queryInterface.createTable("Families", familyAttributes, {
        transaction,
      })
      await queryInterface.createTable("Purchases", purchaseAttributes, {
        transaction,
      })
      await queryInterface.createTable(
        "TimelimitRules",
        timelimitruleAttributes,
        { transaction },
      )
      await queryInterface.createTable("UsedTimes", usedTimeAttribute, {
        transaction,
      })
      await queryInterface.createTable("Users", userAttributes, {
        transaction,
      })
    },
  )
}

export async function down() {
  throw new Error("not possible")
}
