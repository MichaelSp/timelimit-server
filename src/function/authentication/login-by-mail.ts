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

import { Forbidden, Gone, TooManyRequests, Unauthorized } from 'http-errors'
import { Database } from '../../database'
import { sendAuthenticationMail } from '../../util/mail'
import { areWordSequencesEqual, randomWords } from '../../util/random-words'
import { checkMailSendLimit } from '../../util/ratelimit-authmail'
import { generateAuthToken } from '../../util/token'
import { createAuthTokenByMailAddress } from './index'

export const sendLoginCode = async ({ mail, deviceAuthToken, locale, database, info }: {
  mail: string
  deviceAuthToken?: string
  locale: string
  database: Database
  info: Buffer
  // no transaction here because this is directly called from an API endpoint
}): Promise<{ mailLoginToken: string }> => {
  let deviceName = null

  if (deviceAuthToken !== undefined) {
    const info = await database.transaction(async (transaction) => {
      const deviceEntryUnsafe = await database.device.findOne({
        where: { deviceAuthToken },
        attributes: ['familyId', 'name'],
        transaction
      })

      if (!deviceEntryUnsafe) {
        throw new Unauthorized()
      }

      const deviceEntry = {
        familyId: deviceEntryUnsafe.familyId,
        name: deviceEntryUnsafe.name
      }

      const userEntryCounter = await database.user.count({
        where: {
          familyId: deviceEntry.familyId,
          mail
        },
        transaction
      })

      if (userEntryCounter === 1) {
        return { deviceName: deviceEntry.name }
      } else {
        // do not show the device name if it is from another family
        // otherwise third parties could chose a part of the content of the mail
        return { deviceName: null }
      }
    })

    deviceName = info.deviceName
  }

  try {
    await checkMailSendLimit(mail)
  } catch (ex) {
    throw new TooManyRequests()
  }

  const mailLoginToken = generateAuthToken()
  const code = randomWords(3)

  await sendAuthenticationMail({
    receiver: mail,
    code,
    locale,
    deviceName,
    info
  })

  await database.transaction(async (transaction) => {
    await database.mailLoginToken.create({
      mailLoginToken,
      receivedCode: code,
      mail,
      createdAt: Date.now().toString(10),
      remainingAttempts: 3,
      locale
    }, { transaction })
  })

  return {
    mailLoginToken
  }
}

// 403 Forbidden = receivedCode is invalid
// 410 Gone = mailLoginToken is invalid or expired
export const signInByMailCode = async ({ mailLoginToken, receivedCode, database }: {
  mailLoginToken: string
  receivedCode: string
  database: Database
  // no transaction here because this is directly called from an API endpoint
}): Promise<{ mailAuthToken: string }> => {
  const result = await database.transaction(async (transaction) => {
    const entry = await database.mailLoginToken.findOne({
      where: {
        mailLoginToken
      },
      transaction
    })

    if ((!entry) || entry.remainingAttempts === 0) {
      throw new Gone()
    }

    if (!areWordSequencesEqual(entry.receivedCode, receivedCode)) {
      entry.remainingAttempts--

      await entry.save({ transaction })

      if (entry.remainingAttempts === 0) {
        return () => { throw new Gone() }
      } else {
        return () => { throw new Forbidden() }
      }
    }

    const counter = await database.mailLoginToken.destroy({
      where: {
        mailLoginToken
      },
      transaction
    })

    if (counter !== 1) {
      throw new Gone()
    }

    const mailAuthToken = await createAuthTokenByMailAddress({
      mail: entry.mail,
      locale: entry.locale,
      database,
      transaction
    })

    return () => ({ mailAuthToken })
  })

  return result()
}
