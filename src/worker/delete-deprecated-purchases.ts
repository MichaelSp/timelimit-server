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

import * as Sequelize from "sequelize"
import { Database } from "../database"
import { notifyClientsAboutChangesDelayed } from "../function/websocket"
import { WebsocketApi } from "../websocket"

export function initDeleteDeprecatedPurchasesWorker({
  database,
  websocket,
}: {
  database: Database
  websocket: WebsocketApi
}) {
  function doWorkSafe() {
    console.log("deleting deprecated purchases now")

    deleteDeprecatedPurchases({ database, websocket })
      .then(() => {
        console.log("finished deleting deprecated purchases")
      })
      .catch((ex) => {
        console.warn("error deleting deprecated purchases", ex)
      })
  }

  setTimeout(
    () => {
      doWorkSafe()

      setInterval(
        () => {
          doWorkSafe()
        },
        1000 * 60 * 60 /* every hour */,
      )
    },
    1000 * 60 * 5 /* after 5 minutes */,
  )
}

async function deleteDeprecatedPurchases({
  database,
  websocket,
}: {
  database: Database
  websocket: WebsocketApi
}) {
  await database.transaction(async (transaction) => {
    const affectedFamilyIds = (
      await database.family.findAll({
        where: {
          hasFullVersion: true,
          fullVersionUntil: {
            [Sequelize.Op.lt]: Date.now().toString(10),
          },
        },
        attributes: ["familyId"],
        transaction,
        limit: 100,
      })
    ).map((item) => item.familyId)

    await database.family.update(
      {
        hasFullVersion: false,
      },
      {
        where: {
          familyId: {
            [Sequelize.Op.in]: affectedFamilyIds,
          },
        },
        transaction,
      },
    )

    for (const familyId of affectedFamilyIds) {
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

    return { affectedFamilyIds }
  })
}
