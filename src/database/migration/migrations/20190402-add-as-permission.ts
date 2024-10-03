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
import { attributesVersion8 } from "../../device"
import { Migration } from "../../main"

export const up: Migration = async ({ context }) => {
  const queryInterface = context.getQueryInterface()
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      await queryInterface.addColumn(
        "Devices",
        "asEnabled",
        {
          ...attributesVersion8.asEnabled,
        },
        {
          transaction,
        },
      )

      await queryInterface.addColumn(
        "Devices",
        "wasAsEnabled",
        {
          ...attributesVersion8.wasAsEnabled,
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
      await queryInterface.removeColumn("Devices", "asEnabled", {
        transaction,
      })
      await queryInterface.removeColumn("Devices", "wasAsEnabled", {
        transaction,
      })
    },
  )
}
