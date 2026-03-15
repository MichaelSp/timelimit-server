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

import { json } from 'body-parser'
import { Router } from 'express'
import { BadRequest, Conflict } from 'http-errors'
import * as Sequelize from 'sequelize'
import { Database } from '../database'
import { addPurchase, canDoNextPurchase } from '../function/purchase'
import { getStatusMessage, setStatusMessage } from '../function/statusmessage'
import { EventHandler } from '../monitoring/eventhandler'
import { generatePurchaseId } from '../util/token'
import { verifyIdentitifyToken, TokenValidationException } from '../util/identity-token'
import { WebsocketApi } from '../websocket'

export const createAdminRouter = ({ database, websocket, eventHandler }: {
  database: Database
  websocket: WebsocketApi
  eventHandler: EventHandler
}) => {
  const router = Router()

  router.get('/status', async (_, res, next) => {
    try {
      const { counters, maxValues } = await eventHandler.getValues()

      res.json({
        websocketClients: websocket.countConnections(),
        counters,
        maxValues
      })
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/reset-counters', async (_, res, next) => {
    try {
      await eventHandler.reset()

      res.json({ ok: true })
    } catch (ex) {
      next(ex)
    }
  })

  router.get('/status-message', async (_, res, next) => {
    try {
      const currentStatusMessage = await getStatusMessage({ database })

      res.json({
        statusMessage: currentStatusMessage
      })
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/status-message', json(), async (req, res, next) => {
    try {
      if (typeof req.body !== 'object' || typeof req.body.message !== 'string') {
        throw new BadRequest()
      }

      const newStatusMessage = req.body.message as string

      await setStatusMessage({ database, newStatusMessage })

      websocket.triggerImportantSyncAtAllDevicesInBackground()

      res.json({ ok: true })
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/unlock-premium', json(), async (req, res, next) => {
    try {
      if (typeof req.body !== 'object' || typeof req.body.mail !== 'string' || typeof req.body.duration !== 'string') {
        throw new BadRequest()
      }

      const mail: string = req.body.mail
      const type: string = req.body.duration

      if (type !== 'month' && type !== 'year' || mail === '') {
        throw new BadRequest()
      }

      await database.transaction(async (transaction) => {
        const userEntryUnsafe = await database.user.findOne({
          where: {
            mail
          },
          attributes: ['familyId'],
          transaction
        })

        if (!userEntryUnsafe) {
          throw new Conflict('no user with specified mail address')
        }

        const userEntry = {
          familyId: userEntryUnsafe.familyId
        }

        await addPurchase({
          database,
          familyId: userEntry.familyId,
          type,
          service: 'directpurchase',
          transactionId: 'legacyunlock-' + type + '-' + generatePurchaseId(),
          websocket,
          transaction
        })
      })

      res.json({ ok: true })
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/unlock-premium-v2', json(), async (req, res, next) => {
    try {
      if (
        typeof req.body !== 'object' ||
        typeof req.body.purchaseToken !== 'string' ||
        typeof req.body.purchaseId !== 'string' ||
        typeof req.body.dryRun !== 'boolean'
      ) {
        throw new BadRequest()
      }

      const purchaseToken: string = req.body.purchaseToken
      const purchaseId: string = req.body.purchaseId
      const dryRun: boolean = req.body.dryRun

      const tokenContent = await verifyIdentitifyToken(purchaseToken)

      if (tokenContent.purpose !== 'purchase') {
        res.json({ ok: false, error: 'token invalid', detail: 'wrong purpose' })

        return
      }

      const response = await database.transaction(async (transaction) => {
        const userValid = await database.user.count({
          where: {
            familyId: tokenContent.familyId,
            userId: tokenContent.userId,
            mail: tokenContent.mail,
            type: 'parent'
          },
          transaction
        })

        if (!userValid) return {
          ok: false,
          error: 'token invalid',
          detail: 'user not found'
        }

        let mailToReturn: string

        if (tokenContent.mail !== '') mailToReturn = tokenContent.mail
        else {
          const userEntryWithMail = await database.user.findOne({
            where: {
              familyId: tokenContent.familyId,
              mail: {
                [Sequelize.Op.ne]: ''
              },
              type: 'parent'
            },
            transaction
          })

          if (!userEntryWithMail) return {
            ok: false,
            error: 'illegal state',
            detail: 'no user with mail found'
          }

          mailToReturn = userEntryWithMail.mail
        }

        let wasAlreadyExecuted: boolean

        const oldPurchaseByPurchaseId = await database.purchase.findOne({
          where: {
            service: 'directpurchase',
            transactionId: purchaseId
          }
        })

        if (oldPurchaseByPurchaseId === null) wasAlreadyExecuted = false
        else if (oldPurchaseByPurchaseId.familyId === tokenContent.familyId) wasAlreadyExecuted = true
        else return {
          ok: false,
          error: 'purchase id already used'
        }

        if (!wasAlreadyExecuted) {
          const familyEntry = await database.family.findOne({
            where: {
              familyId: tokenContent.familyId
            },
            transaction
          })

          if (!familyEntry) return {
            ok: false,
            error: 'family not found'
          }

          const canDoPurchase = canDoNextPurchase({ fullVersionUntil: parseInt(familyEntry.fullVersionUntil) })

          if (!canDoPurchase) {
            const lastPurchase = await database.purchase.findOne({
              where: {
                familyId: tokenContent.familyId
              },
              transaction,
              order: [['loggedAt', 'DESC']],
              limit: 1
            })

            return {
              ok: false,
              error: 'can not renew now',
              lastPurchase: lastPurchase ? {
                service: lastPurchase.service,
                transactionId: lastPurchase.transactionId,
                timestamp: parseInt(lastPurchase.loggedAt),
                timestring: new Date(parseInt(lastPurchase.loggedAt)).toISOString()
              } : undefined
            }
          }

          if (!dryRun) {
            await addPurchase({
              database,
              familyId: tokenContent.familyId,
              type: 'year',
              service: 'directpurchase',
              transactionId: purchaseId,
              websocket,
              transaction
            })
          }
        }

        return {
          ok: true,
          mail: mailToReturn,
          wasAlreadyExecuted
        }
      })

      res.json(response)
    } catch (ex) {
      if (ex instanceof TokenValidationException) res.json({
        ok: false,
        error: 'token invalid',
        detail: ex.message
      })
      else next(ex)
    }
  })

  return router
}
