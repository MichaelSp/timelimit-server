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
import { Migration } from "../../main.js"

export const up: Migration = async ({ context }) => {
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      const dialect = context.getDialect()
      const isMysql = dialect === "mysql" || dialect === "mariadb"

      if (isMysql) {
        await context.query(
          "ALTER TABLE `EncryptedAppLists` MODIFY `data` MEDIUMBLOB",
          { transaction },
        )
      }
    },
  )
}

export const down: Migration = async ({ context }) => {
  context.transaction(
    {
      type: Transaction.TYPES.EXCLUSIVE,
    },
    async (transaction: Transaction) => {
      const dialect = context.getDialect()
      const isMysql = dialect === "mysql" || dialect === "mariadb"

      if (isMysql) {
        await context.query(
          "ALTER TABLE `EncryptedAppLists` MODIFY `data` BLOB",
          { transaction },
        )
      }
    },
  )
}
