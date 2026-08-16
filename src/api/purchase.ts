/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 */

import { json } from 'body-parser'
import { Router } from 'express'
import { BadRequest, Conflict, Unauthorized } from 'http-errors'
import { SimpleDatabase } from '../database/simple'
import {
  addPurchase,
  areGooglePlayPaymentsPossible,
  canDoNextPurchase,
  googlePlayPublicKey,
  isGooglePlayPurchaseSignatureValid,
  requireFamilyEntry
} from '../function/purchase'
import { WebsocketApi } from '../websocket'
import { isCanDoPurchaseRequest, isFinishPurchaseByGooglePlayRequest } from './validator'

export const createPurchaseRouter = ({ database, websocket }: {
  database: SimpleDatabase
  websocket: WebsocketApi
}) => {
  const router = Router()

  router.post('/can-do-purchase', json(), async (req, res, next) => {
    try {
      if (!isCanDoPurchaseRequest(req.body)) throw new BadRequest()
      if (req.body.type === 'googleplay' && !areGooglePlayPaymentsPossible) {
        res.json({ canDoPurchase: 'no because not supported by the server' })
        return
      }
      const result: boolean = await database.transaction(async (transaction) => {
        const familyEntry = await requireFamilyEntry({ transaction, deviceAuthToken: req.body.deviceAuthToken })
        return canDoNextPurchase({
          fullVersionUntil: parseInt(familyEntry.fullVersionUntil, 10),
          fullVersionDebts: parseInt(familyEntry.fullVersionDebts, 10),
        })
      })
      res.json({
        canDoPurchase: result ? 'yes' : 'no due to old purchase',
        googlePlayPublicKey
      })
    } catch (ex) {
      next(ex)
    }
  })

  router.post('/finish-purchase-by-google-play', json(), async (req, res, next) => {
    try {
      if (!isFinishPurchaseByGooglePlayRequest(req.body)) throw new BadRequest()
      await database.transaction(async (transaction) => {
        const deviceEntryUnsafe = await transaction.legacy.database.device.findOne({
          where: { deviceAuthToken: req.body.deviceAuthToken },
          attributes: ['familyId'],
          transaction: transaction.legacy.transaction
        })
        if (!deviceEntryUnsafe) throw new Unauthorized()
        const deviceEntry = { familyId: deviceEntryUnsafe.familyId }
        if (!isGooglePlayPurchaseSignatureValid({
          receipt: req.body.receipt,
          signature: req.body.signature
        })) throw new Conflict()
        const receipt = JSON.parse(req.body.receipt)
        if (typeof receipt !== 'object') throw new Conflict()
        let type: 'month' | 'year'
        if (receipt.productId === 'premium_year_2018') type = 'year'
        else if (receipt.productId === 'premium_month_2018') type = 'month'
        else throw new Conflict()
        const orderId = receipt.orderId
        if (typeof orderId !== 'string') throw new Conflict()
        await addPurchase({
          transaction,
          familyId: deviceEntry.familyId,
          type,
          service: 'googleplay',
          transactionId: orderId,
          websocket
        })
      })
      res.json({ ok: true })
    } catch (ex) {
      next(ex)
    }
  })

  return router
}
