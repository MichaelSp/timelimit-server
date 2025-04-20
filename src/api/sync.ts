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

import { json } from "body-parser"
import { Router } from "express"
import { BadRequest, Unauthorized } from "http-errors"
import { VisibleConnectedDevicesManager } from "../connected-devices/index.js"
import { Database } from "../database/index.js"
import { reportDeviceRemoved } from "../function/device/report-device-removed.js"
import { applyActionsFromDevice } from "../function/sync/apply-actions/index.js"
import { generateServerDataStatus } from "../function/sync/get-server-data-status/index.js"
import { EventHandler } from "../monitoring/eventhandler.js"
import { WebsocketApi } from "../websocket/index.js"
import {
  isClientPullChangesRequest,
  isClientPushChangesRequest,
  isRequestWithAuthToken,
} from "./validator.js"

const getRoundedTimestampForLastConnectivity = () => {
  const now = Date.now()

  return now - (now % (1000 * 60 * 60 * 12)) /* 12 hours */
}

export const createSyncRouter = ({
  database,
  websocket,
  connectedDevicesManager,
  eventHandler,
}: {
  database: Database
  websocket: WebsocketApi
  connectedDevicesManager: VisibleConnectedDevicesManager
  eventHandler: EventHandler
}) => {
  const router = Router()

  router.post(
    "/push-actions",
    json({
      limit: "5120kb",
    }),
    async (req, res, next) => {
      try {
        eventHandler.countEvent("pushChangesRequest")

        if (!isClientPushChangesRequest(req.body)) {
          eventHandler.countEvent("pushChangesRequest invalid")

          throw new BadRequest()
        }

        const { shouldDoFullSync } = await applyActionsFromDevice({
          request: req.body,
          database,
          websocket,
          connectedDevicesManager,
          eventHandler,
        })

        if (shouldDoFullSync) {
          eventHandler.countEvent("pushChangesRequest shouldDoFullSync")
        }

        res.json({
          shouldDoFullSync,
        })
      } catch (ex) {
        next(ex)
      }
    },
  )

  router.post("/pull-status", json(), async (req, res, next) => {
    try {
      eventHandler.countEvent("pullStatusRequest")

      const { body } = req

      if (!isClientPullChangesRequest(body)) {
        eventHandler.countEvent("pullStatusRequest invalid")

        throw new BadRequest()
      }

      const serverStatus = await database.transaction(async (transaction) => {
        const deviceEntryUnsafe = await database.device.findOne({
          where: {
            deviceAuthToken: body.deviceAuthToken,
          },
          attributes: ["familyId", "deviceId", "lastConnectivity"],
          transaction,
        })

        if (!deviceEntryUnsafe) {
          throw new Unauthorized()
        }

        const { familyId, deviceId, lastConnectivity } = deviceEntryUnsafe
        const now = getRoundedTimestampForLastConnectivity()

        if (parseInt(lastConnectivity, 10) !== now) {
          await database.device.update(
            {
              lastConnectivity: now.toString(10),
            },
            {
              where: {
                deviceAuthToken: body.deviceAuthToken,
              },
              transaction,
            },
          )
        }

        return generateServerDataStatus({
          database,
          familyId,
          deviceId,
          clientStatus: body.status,
          transaction,
          eventHandler,
        })
      })

      if (serverStatus.devices) {
        eventHandler.countEvent("pullStatusRequest devices")
      }
      if (serverStatus.apps) {
        eventHandler.countEvent("pullStatusRequest apps")
      }
      if (serverStatus.categoryBase) {
        eventHandler.countEvent("pullStatusRequest categoryBase")
      }
      if (serverStatus.categoryApp) {
        eventHandler.countEvent("pullStatusRequest categoryApp")
      }
      if (serverStatus.usedTimes) {
        eventHandler.countEvent("pullStatusRequest usedTimes")
      }
      if (serverStatus.rules) {
        eventHandler.countEvent("pullStatusRequest rules")
      }
      if (serverStatus.users) {
        eventHandler.countEvent("pullStatusRequest users")
      }
      if (serverStatus.krq) {
        eventHandler.countEvent("pullStatusRequest pendingKeyRequests")
      }
      if (serverStatus.kr) {
        eventHandler.countEvent("pullStatusRequest keyResponses")
      }
      if (serverStatus.dh) {
        eventHandler.countEvent("pullStatusRequest dh")
      }
      if (serverStatus.u2f) {
        eventHandler.countEvent("pullStatusRequest u2f")
      }

      res.json(serverStatus)
    } catch (ex) {
      next(ex)
    }
  })

  router.post("/report-removed", json(), async (req, res, next) => {
    try {
      if (!isRequestWithAuthToken(req.body)) {
        throw new BadRequest()
      }

      await reportDeviceRemoved({
        database,
        deviceAuthToken: req.body.deviceAuthToken,
        websocket,
      })

      res.json({ ok: true })
    } catch (ex) {
      next(ex)
    }
  })

  router.post("/is-device-removed", json(), async (req, res, next) => {
    try {
      if (!isRequestWithAuthToken(req.body)) {
        throw new BadRequest()
      }

      const isDeviceRemoved: boolean = await database.transaction(
        async (transaction) => {
          const removedEntry = await database.oldDevice.findOne({
            where: {
              deviceAuthToken: req.body.deviceAuthToken,
            },
            transaction,
          })

          return !!removedEntry
        },
      )

      res.json({
        isDeviceRemoved,
      })
    } catch (ex) {
      next(ex)
    }
  })

  return router
}
