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

import { parseParentAction } from "../../../../action/serialization"
import { ClientPushChangesRequestAction } from "../../../../api/schema"
import { isSerializedParentAction } from "../../../../api/validator"
import { UserFlags } from "../../../../model/userflags"
import { EventHandler } from "../../../../monitoring/eventhandler"
import { Cache } from "../cache"
import { dispatchParentAction as dispatchParentActionInternal } from "../dispatch-parent-action"
import { SourceDeviceNotFoundException } from "../exception/illegal-state"
import { SelfLimitNotPossibleException } from "../exception/self-limit"
import { AuthenticationMethod } from "../types"
import { dispatch } from "./helper"

export async function dispatchParentAction({
  action,
  eventHandler,
  cache,
  isChildLimitAdding,
  deviceId,
  authentication,
}: {
  action: ClientPushChangesRequestAction
  cache: Cache
  eventHandler: EventHandler
  isChildLimitAdding: boolean
  deviceId: string
  authentication: AuthenticationMethod
}) {
  return dispatch({
    action,
    eventHandler,
    type: "parent",
    validator: isSerializedParentAction,
    parser: parseParentAction,
    applier: async (parsedAction) => {
      if (isChildLimitAdding) {
        const deviceEntryUnsafe = await cache.database.device.findOne({
          attributes: ["currentUserId"],
          where: {
            familyId: cache.familyId,
            deviceId,
            currentUserId: action.userId,
          },
          transaction: cache.transaction,
        })

        if (!deviceEntryUnsafe) {
          throw new SourceDeviceNotFoundException()
        }

        const deviceUserId = deviceEntryUnsafe.currentUserId

        if (!deviceUserId) {
          throw new SelfLimitNotPossibleException({
            staticMessage:
              "no device user id set but child add self limit action requested",
          })
        }

        const deviceUserEntryUnsafe = await cache.database.user.findOne({
          attributes: ["flags"],
          where: {
            familyId: cache.familyId,
            userId: deviceUserId,
            type: "child",
          },
          transaction: cache.transaction,
        })

        if (!deviceUserEntryUnsafe) {
          throw new SelfLimitNotPossibleException({
            staticMessage: "no child user found for child limit adding action",
          })
        }

        if (
          (parseInt(deviceUserEntryUnsafe.flags, 10) &
            UserFlags.ALLOW_SELF_LIMIT_ADD) !==
          UserFlags.ALLOW_SELF_LIMIT_ADD
        ) {
          throw new SelfLimitNotPossibleException({
            staticMessage: "child add limit action found but not allowed",
          })
        }

        await dispatchParentActionInternal({
          action: parsedAction,
          cache,
          parentUserId: action.userId,
          sourceDeviceId: deviceId,
          fromChildSelfLimitAddChildUserId: deviceUserId,
          authentication,
        })
      } else {
        await dispatchParentActionInternal({
          action: parsedAction,
          cache,
          parentUserId: action.userId,
          sourceDeviceId: deviceId,
          fromChildSelfLimitAddChildUserId: null,
          authentication,
        })
      }
    },
  })
}
