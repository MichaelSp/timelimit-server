/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2021 Jonas Lochmann
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

import { Unauthorized } from "http-errors"
import { Database, Transaction } from "../../database/index.js"
import { generateAuthToken } from "../../util/token.js"

export const createAuthTokenByMailAddress = async ({
  mail,
  database,
  transaction,
  locale,
}: {
  mail: string
  database: Database
  transaction: Transaction
  locale: string
}) => {
  const token = generateAuthToken()

  await database.authtoken.create(
    {
      token,
      mail,
      createdAt: Date.now().toString(),
      locale,
    },
    { transaction },
  )

  return token
}

export const getMailAndLocaleByAuthToken = async ({
  mailAuthToken,
  database,
  transaction,
  invalidate,
}: {
  mailAuthToken: string
  database: Database
  transaction: Transaction
  invalidate: boolean
}) => {
  const entry = await database.authtoken.findOne({
    where: {
      token: mailAuthToken,
    },
    transaction,
  })

  if (entry) {
    if (invalidate) {
      const rowCounter = await database.authtoken.destroy({
        where: {
          token: mailAuthToken,
        },
        transaction,
      })

      if (rowCounter !== 1) {
        return null
      }
    }

    return {
      mail: entry.mail,
      locale: entry.locale,
    }
  } else {
    return null
  }
}

export const requireMailAndLocaleByAuthToken = async ({
  mailAuthToken,
  database,
  transaction,
  invalidate,
}: {
  mailAuthToken: string
  database: Database
  transaction: Transaction
  invalidate: boolean
}) => {
  const result = await getMailAndLocaleByAuthToken({
    mailAuthToken,
    database,
    transaction,
    invalidate,
  })

  if (!result) {
    throw new Unauthorized()
  }

  return result
}
