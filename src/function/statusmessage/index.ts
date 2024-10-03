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

import * as Sequelize from "sequelize"
import { Database } from "../../database"
import { configItemIds } from "../../database/config"

export const getStatusMessage = async ({
  database,
  transaction,
}: {
  database: Database
  transaction?: Sequelize.Transaction
}) => {
  const currentStatusMessageItem = await database.config.findByPk(
    configItemIds.statusMessage,
    { transaction },
  )
  const currentStatusMessage =
    (currentStatusMessageItem ? currentStatusMessageItem.value : null) || ""

  return currentStatusMessage
}

export const setStatusMessage = async ({
  database,
  newStatusMessage,
}: {
  database: Database
  newStatusMessage: string
}) => {
  await database.transaction(async (transaction) => {
    if (newStatusMessage === "") {
      await database.config.destroy({
        where: {
          id: configItemIds.statusMessage,
        },
        transaction,
      })
    } else {
      await database.config.upsert(
        {
          id: configItemIds.statusMessage,
          value: newStatusMessage,
        },
        { transaction },
      )
    }
  })
}
