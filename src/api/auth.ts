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

import { json } from 'body-parser'
import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { Database } from '../database'
import { sendLoginCode, signInByMailCode } from '../function/authentication/login-by-mail'
import { isMailServerBlacklisted } from '../util/mail'
import {
  isSendMailLoginCodeRequest,
  isSignInByMailCodeRequest
} from './validator'

export const createAuthRouter = (database: Database) => {
  const router = Router()

  router.post('/send-mail-login-code-v2', json(), async (req, res, next) => {
    try {
      if (!isSendMailLoginCodeRequest(req.body)) {
        throw new BadRequest()
      }

      if (isMailServerBlacklisted(req.body.mail)) {
        res.json({ mailServerBlacklisted: true })
      } else {
        const { mailLoginToken } = await sendLoginCode({
          mail: req.body.mail,
          locale: req.body.locale,
          database
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
