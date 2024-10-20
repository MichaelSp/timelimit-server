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

import { json } from 'body-parser'
import { Router } from 'express'
import { BadRequest, Forbidden } from 'http-errors'
import { config } from '../config'
import { Database } from '../database'
import { sendLoginCode, signInByMailCode } from '../function/authentication/login-by-mail'
import { isMailAddressCoveredByWhitelist, isMailServerBlacklisted, sanitizeMailAddress } from '../util/mail'
import {
  isSendMailLoginCodeRequest,
  isSignInByMailCodeRequest
} from './validator'
import { analyze } from './integrity'

export const createAuthRouter = (database: Database) => {
  const router = Router()

  router.post('/send-mail-login-code-v2', json(), async (req, res, next) => {
    const info = {
      ua: req.headers['user-agent'],
      cert: analyze(req),
    }

    try {
      if (!isSendMailLoginCodeRequest(req.body)) {
        throw new BadRequest()
      }

      const mail = sanitizeMailAddress(req.body.mail)

      if (!mail) {
        throw new BadRequest()
      }

      if (!isMailAddressCoveredByWhitelist(mail)) {
        res.json({ mailAddressNotWhitelisted: true })
      } else if (isMailServerBlacklisted(mail)) {
        res.json({ mailServerBlacklisted: true })
      } else if (config.uaMailBlocklist.indexOf(req.headers['user-agent'] || '') !== -1) {
        throw new Forbidden()
      } else {
        const { mailLoginToken } = await sendLoginCode({
          mail,
          deviceAuthToken: req.body.deviceAuthToken,
          locale: req.body.locale,
          database,
          info: Buffer.from(JSON.stringify(info), 'utf8')
        })

        res.json({ mailLoginToken })
      }
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/sign-in-by-mail-code', json(), async (req, res, next) => {
    try {
      if (!isSignInByMailCodeRequest(req.body)) {
        throw new BadRequest()
      }

      const { mailAuthToken } = await signInByMailCode({
        receivedCode: req.body.receivedCode,
        mailLoginToken: req.body.mailLoginToken,
        database
      })

      res.json({ mailAuthToken })
    } catch (ex) {
      next(ex)
    }
  })

  return router
}
