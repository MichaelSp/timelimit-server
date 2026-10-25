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

import { BadRequest, Conflict } from 'http-errors'
import { ClientPushChangesRequest, DesktopReceipt } from '../../../api/schema'
import { VisibleConnectedDevicesManager } from '../../../connected-devices'
import { SimpleDatabase } from '../../../database/simple'
import { shouldRetryWithException } from '../../../database'
import { EventHandler } from '../../../monitoring/eventhandler'
import { WebsocketApi } from '../../../websocket'
import { notifyClientsAboutChangesDelayed } from '../../websocket'
import { getApplyActionBaseInfo } from './baseinfo'
import { Cache } from './cache'
import { dispatchAppLogicAction, dispatchChildAction, dispatchParentAction } from './dispatch-helper'
import { ApplyActionException } from './exception'
import { IllegalStateException } from './exception/illegal-state'
import { SequenceNumberRepeatedException } from './exception/sequence'
import { assertActionIntegrity } from './integrity'

export const applyActionsFromDevice = async ({ database, request, websocket, connectedDevicesManager, eventHandler }: {
  database: SimpleDatabase
  websocket: WebsocketApi
  request: ClientPushChangesRequest
  connectedDevicesManager: VisibleConnectedDevicesManager
  eventHandler: EventHandler
  // no transaction here because this is directly called from an API endpoint
}): Promise<{ shouldDoFullSync: boolean, desktopReceipt?: DesktopReceipt }> => {
  eventHandler.countEvent("applyActionsFromDevice")

  if (request.actions.length > 50) {
    eventHandler.countEvent("applyActionsFromDevice tooMuchActionsPerRequest")

    throw new BadRequest()
  }

  return database.transaction(async (transaction) => {
    const baseInfo = await getApplyActionBaseInfo({ transaction, deviceAuthToken: request.deviceAuthToken })

    const checkpoint = request.desktopCheckpoint

    if (checkpoint) {
      const existingReceipt = await transaction.legacy.database.desktopSyncReceipt.findOne({
        where: {
          familyId: baseInfo.familyId,
          deviceId: baseInfo.deviceId,
          checkpointId: checkpoint.id,
        },
        transaction: transaction.legacy.transaction,
      })

      if (existingReceipt) {
        if (existingReceipt.payloadSha256 !== checkpoint.payloadSha256) {
          throw new Conflict('desktop checkpoint id was already used with a different payload')
        }

        return {
          shouldDoFullSync: existingReceipt.shouldDoFullSync,
          desktopReceipt: {
            id: checkpoint.id,
            payloadSha256: existingReceipt.payloadSha256,
            acceptedThrough: Number(existingReceipt.acceptedThrough),
          },
        }
      }
    }

    const cache = new Cache({
      transaction,
      hasFullVersion: baseInfo.hasFullVersion,
      familyId: baseInfo.familyId,
      deviceId: baseInfo.deviceId,
      connectedDevicesManager,
    })

    let { nextSequenceNumber } = baseInfo

    for (const action of request.actions) {
      try {
        if (action.sequenceNumber < nextSequenceNumber) {
          // action was already received
          throw new SequenceNumberRepeatedException()
        }

        await cache.subtransaction(async () => {
          // update the next sequence number
          nextSequenceNumber = action.sequenceNumber + 1

          if (action.type === "appLogic") {
            await dispatchAppLogicAction({
              action,
              cache,
              deviceId: baseInfo.deviceId,
              eventHandler,
            })
          } else if (action.type === "parent") {
            const { isChildLimitAdding, authentication } =
              await assertActionIntegrity({
                deviceId: baseInfo.deviceId,
                cache,
                action,
              })

            await dispatchParentAction({
              action,
              cache,
              deviceId: baseInfo.deviceId,
              eventHandler,
              isChildLimitAdding,
              authentication,
            })
          } else if (action.type === "child") {
            await assertActionIntegrity({
              deviceId: baseInfo.deviceId,
              cache,
              action,
            })

            await dispatchChildAction({
              action,
              cache,
              childUserId: action.userId,
              deviceId: baseInfo.deviceId,
              eventHandler,
            })
          } else {
            throw new IllegalStateException({
              staticMessage: "not possible action.type value",
            })
          }
        })
      } catch (ex) {
        if (shouldRetryWithException(transaction.legacy.database, ex)) {
          eventHandler.countEvent('applyActionsFromDevice got exception which should cause retry')

          throw ex
        } else if (ex instanceof ApplyActionException) {
          eventHandler.countEvent(
            "applyActionsFromDevice errorDispatchingAction:" + ex.staticMessage,
          )
        } else {
          const stack =
            ex instanceof Error && ex.stack
              ? ex.stack.substring(0, 4096)
              : "no stack"

          eventHandler.countEvent(
            "applyActionsFromDevice errorDispatchingAction:other:" + stack,
          )
        }

        cache.requireSenderFullSync()
      }
    }

    // save new next sequence number
    if (nextSequenceNumber !== baseInfo.nextSequenceNumber) {
      eventHandler.countEvent("applyActionsFromDevice updateSequenceNumber")

      await transaction.legacy.database.device.update({
        nextSequenceNumber
      }, {
        where: {
          familyId: baseInfo.familyId,
          deviceId: baseInfo.deviceId
        },
        transaction: transaction.legacy.transaction
      })
    }

    await cache.saveModifiedVersionNumbers()

    await notifyClientsAboutChangesDelayed({
      familyId: baseInfo.familyId,
      sourceDeviceId: baseInfo.deviceId,
      websocket,
      transaction,
      generalLevel: cache.triggeredSyncLevel,
      targetedLevels: cache.targetedTriggeredSyncLevels,
    })

    if (cache.triggeredSyncLevel === 2) {
      transaction.enqueueAfterCommit(() => {
        eventHandler.countEvent('applyActionsFromDevice areChangesImportant')
      })
    } else if ([...cache.targetedTriggeredSyncLevels.entries()].some((entry) => entry[1] === 2)) {
      transaction.enqueueAfterCommit(() => {
        eventHandler.countEvent('applyActionsFromDevice areChangesImportantTargeted')
      })
    }

    const shouldDoFullSync = cache.isSenderDoFullSyncTrue()
    const acceptedThrough = nextSequenceNumber - 1

    if (checkpoint) {
      await transaction.legacy.database.desktopSyncReceipt.create({
        familyId: baseInfo.familyId,
        deviceId: baseInfo.deviceId,
        checkpointId: checkpoint.id,
        payloadSha256: checkpoint.payloadSha256,
        acceptedThrough,
        shouldDoFullSync,
      }, {
        transaction: transaction.legacy.transaction,
      })
    }

    return {
      shouldDoFullSync,
      ...(checkpoint ? {
        desktopReceipt: {
          id: checkpoint.id,
          payloadSha256: checkpoint.payloadSha256,
          acceptedThrough,
        },
      } : {}),
    }
  })
}
