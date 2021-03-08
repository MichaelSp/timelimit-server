/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2020 Jonas Lochmann
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

import { BadRequest } from 'http-errors'
import { ClientPushChangesRequest } from '../../../api/schema'
import { VisibleConnectedDevicesManager } from '../../../connected-devices'
import { Database, shouldRetryWithException } from '../../../database'
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
  database: Database
  websocket: WebsocketApi
  request: ClientPushChangesRequest
  connectedDevicesManager: VisibleConnectedDevicesManager
  eventHandler: EventHandler
  // no transaction here because this is directly called from an API endpoint
}): Promise<{ shouldDoFullSync: boolean }> => {
  eventHandler.countEvent('applyActionsFromDevice')

  if (request.actions.length > 50) {
    eventHandler.countEvent('applyActionsFromDevice tooMuchActionsPerRequest')

    throw new BadRequest()
  }

  return database.transaction(async (transaction) => {
    const baseInfo = await getApplyActionBaseInfo({ database, transaction, deviceAuthToken: request.deviceAuthToken })

    const cache = new Cache({
      database,
      hasFullVersion: baseInfo.hasFullVersion,
      transaction,
      familyId: baseInfo.familyId,
      connectedDevicesManager
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

          const { isChildLimitAdding } = await assertActionIntegrity({
            deviceId: baseInfo.deviceId,
            cache,
            action
          })

          if (action.type === 'appLogic') {
            await dispatchAppLogicAction({
              action,
              cache,
              deviceId: baseInfo.deviceId,
              eventHandler
            })
          } else if (action.type === 'parent') {
            await dispatchParentAction({
              action,
              cache,
              deviceId: baseInfo.deviceId,
              eventHandler,
              isChildLimitAdding
            })
          } else if (action.type === 'child') {
            await dispatchChildAction({
              action,
              cache,
              childUserId: action.userId,
              deviceId: baseInfo.deviceId,
              eventHandler
            })
          } else {
            throw new IllegalStateException({ staticMessage: 'not possible action.type value' })
          }
        })
      } catch (ex) {
        if (shouldRetryWithException(ex, database)) {
          eventHandler.countEvent('applyActionsFromDevice got exception which should cause retry')

          throw ex
        } else if (ex instanceof ApplyActionException) {
          eventHandler.countEvent('applyActionsFromDevice errorDispatchingAction:' + ex.staticMessage)
        } else {
          const stack = ex instanceof Error && ex.stack ? ex.stack.substring(0, 4096) : 'no stack'

          eventHandler.countEvent('applyActionsFromDevice errorDispatchingAction:other:' + stack)
        }

        cache.requireFullSync()
      }
    }

    // save new next sequence number
    if (nextSequenceNumber !== baseInfo.nextSequenceNumber) {
      eventHandler.countEvent('applyActionsFromDevice updateSequenceNumber')

      await database.device.update({
        nextSequenceNumber
      }, {
        where: {
          familyId: baseInfo.familyId,
          deviceId: baseInfo.deviceId
        },
        transaction
      })
    }

    await cache.saveModifiedVersionNumbers()

    await notifyClientsAboutChangesDelayed({
      familyId: baseInfo.familyId,
      sourceDeviceId: baseInfo.deviceId,
      isImportant: cache.areChangesImportant,
      websocket,
      database,
      transaction
    })

    if (cache.areChangesImportant) {
      transaction.afterCommit(() => {
        eventHandler.countEvent('applyActionsFromDevice areChangesImportant')
      })
    }

    return {
      shouldDoFullSync: cache.shouldDoFullSync()
    }
  })
}
