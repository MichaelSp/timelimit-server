/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
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

import { Unauthorized } from 'http-errors'
import { SimpleDatabaseTransaction } from '../../database/simple'
import { generateAuthToken } from '../../util/token'

export const createAuthTokenByMailAddress = async ({
  mail, transaction, locale
}: {
  mail: string, transaction: SimpleDatabaseTransaction, locale: string
}) => {
  const token = generateAuthToken()

  await transaction.legacy.database.authtoken.create({
    token,
    mail,
    createdAt: Date.now().toString(),
    locale
  }, { transaction: transaction.legacy.transaction })

  return token
}

export const getMailAndLocaleByAuthToken = async ({
  mailAuthToken, transaction, invalidate
}: {
  mailAuthToken: string, transaction: SimpleDatabaseTransaction, invalidate: boolean
}) => {
  const entry = await transaction.legacy.database.authtoken.findOne({
    where: {
      token: mailAuthToken
    },
    transaction: transaction.legacy.transaction
  })

  if (entry) {
    if (invalidate) {
      const rowCounter = await transaction.legacy.database.authtoken.destroy({
        where: {
          token: mailAuthToken
        },
        transaction: transaction.legacy.transaction
      })

      if (rowCounter !== 1) {
        return null
      }
    }

    return {
      mail: entry.mail,
      locale: entry.locale
    }
  } else {
    return null
  }
}

export const requireMailAndLocaleByAuthToken = async ({
  mailAuthToken, transaction, invalidate
}: {
  mailAuthToken: string, transaction: SimpleDatabaseTransaction, invalidate: boolean
}) => {
  const result = await getMailAndLocaleByAuthToken({ mailAuthToken, transaction, invalidate })

  if (!result) {
    throw new Unauthorized()
  }

  return result
}
