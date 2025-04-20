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

import { Conflict } from "http-errors"
import { Database, Transaction } from "../../database/index.js"
import { notifyClientsAboutChangesDelayed } from "../../function/websocket/index.js"
import { WebsocketApi } from "../../websocket/index.js"

const day = 1000 * 60 * 60 * 24
const month = day * 31
const year = day * 366

export const addPurchase = async ({
  database,
  familyId,
  type,
  service,
  transactionId,
  websocket,
  transaction,
}: {
  database: Database
  familyId: string
  type: "month" | "year"
  service: "googleplay" | "directpurchase"
  transactionId: string
  websocket: WebsocketApi
  transaction: Transaction
}) => {
  const oldPurchaseEntry = await database.purchase.findOne({
    where: {
      service,
      transactionId,
    },
    transaction,
  })

  if (oldPurchaseEntry) {
    return
  }

  const familyEntry = await database.family.findOne({
    where: {
      familyId,
    },
    transaction,
  })

  if (!familyEntry) {
    throw new Conflict()
  }

  const previousFullVersionEndTime = familyEntry.fullVersionUntil

  const newFullVersionUntil =
    Math.max(parseInt(familyEntry.fullVersionUntil, 10), Date.now()) +
    (type === "year" ? year : month)

  familyEntry.fullVersionUntil = newFullVersionUntil.toString(10)
  familyEntry.hasFullVersion = true

  await familyEntry.save({ transaction })

  await database.purchase.create(
    {
      familyId,
      service,
      transactionId,
      type,
      loggedAt: Date.now().toString(10),
      previousFullVersionEndTime,
      newFullVersionEndTime: newFullVersionUntil.toString(10),
    },
    {
      transaction,
    },
  )

  await notifyClientsAboutChangesDelayed({
    familyId,
    sourceDeviceId: null,
    database,
    websocket,
    generalLevel: 2,
    targetedLevels: new Map(),
    transaction,
  })
}
