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

import { ReplyToKeyRequestAction } from "../../../../action"
import { EventHandler } from "../../../../monitoring/eventhandler"
import { Cache } from "../cache"
import { IllegalStateException } from "../exception/illegal-state"

export async function dispatchReplyToKeyRequestAction({
  deviceId,
  action,
  cache,
  eventHandler,
}: {
  deviceId: string
  action: ReplyToKeyRequestAction
  cache: Cache
  eventHandler: EventHandler
}) {
  const requestUnsafe = await cache.database.keyRequest.findOne({
    where: {
      familyId: cache.familyId,
      serverSequenceNumber: action.requestServerSequenceNumber.toString(10),
    },
    attributes: ["senderDeviceId", "senderSequenceNumber"],
    transaction: cache.transaction,
  })

  if (!requestUnsafe) {
    eventHandler.countEvent(
      "dispatchReplyToKeyRequestAction:request does not exists (anymore)",
    )

    return
  }

  const request = {
    senderDeviceId: requestUnsafe.senderDeviceId,
    senderSequenceNumber: requestUnsafe.senderSequenceNumber,
  }

  const oldReplyCounter = await cache.database.keyResponse.count({
    where: {
      familyId: cache.familyId,
      receiverDeviceId: request.senderDeviceId,
      requestServerSequenceNumber:
        action.requestServerSequenceNumber.toString(10),
      senderDeviceId: deviceId,
    },
    transaction: cache.transaction,
  })

  if (oldReplyCounter !== 0) {
    eventHandler.countEvent(
      "dispatchReplyToKeyRequestAction:got duplicate reply which was ignored",
    )

    return
  }

  const deviceEntryUnsafe = await cache.database.device.findOne({
    where: {
      familyId: cache.familyId,
      deviceId: request.senderDeviceId,
    },
    transaction: cache.transaction,
    attributes: ["nextKeyReplySequenceNumber"],
  })

  if (!deviceEntryUnsafe) {
    throw new IllegalStateException({
      staticMessage: "target device entry not found",
    })
  }

  const deviceEntry = {
    nextKeyReplySequenceNumber: deviceEntryUnsafe.nextKeyReplySequenceNumber,
  }

  await cache.database.device.update(
    {
      nextKeyReplySequenceNumber: (
        parseInt(deviceEntry.nextKeyReplySequenceNumber) + 1
      ).toString(10),
    },
    {
      where: {
        familyId: cache.familyId,
        deviceId: request.senderDeviceId,
      },
      transaction: cache.transaction,
    },
  )

  await cache.database.keyResponse.create(
    {
      familyId: cache.familyId,
      receiverDeviceId: request.senderDeviceId,
      requestServerSequenceNumber:
        action.requestServerSequenceNumber.toString(10),
      senderDeviceId: deviceId,
      replyServerSequenceNumber: deviceEntry.nextKeyReplySequenceNumber,
      requestClientSequenceNumber: requestUnsafe.senderSequenceNumber,
      tempKey: action.tempKey,
      encryptedKey: action.encryptedKey,
      signature: action.signature,
    },
    {
      transaction: cache.transaction,
    },
  )

  cache.incrementTargetedTriggeredSyncLevel(request.senderDeviceId, 2)
}
