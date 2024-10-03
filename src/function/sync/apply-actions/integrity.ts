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

import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { ClientPushChangesRequestAction } from '../../../api/schema'
import { intToBuffer, longToBuffer } from '../../../util/binary-number'
import { U2fValidationError, validateU2fIntegrity } from '../../u2f'
import { Cache } from './cache'
import { ActionObjectTypeNotHandledException } from './exception/illegal-state'
import {
    InvalidChildActionIntegrityValue, InvalidParentActionIntegrityValue,
    InvalidU2fIntegrityValue,
    ParentDeviceActionWithoutParentDeviceException
} from './exception/integrity'
import { AuthenticationMethod } from './types'

export async function assertActionIntegrity ({ action, cache, deviceId }: {
  action: ClientPushChangesRequestAction
  cache: Cache
  deviceId: string
}): Promise<{
  isChildLimitAdding: boolean
  authentication: AuthenticationMethod
}> {
  if (action.type === 'parent') {
    if (action.integrity === 'device') {
      const deviceEntryUnsafe = await cache.database.device.findOne({
        attributes: ['currentUserId'],
        where: {
          familyId: cache.familyId,
          deviceId,
          currentUserId: action.userId,
          isUserKeptSignedIn: true
        },
        transaction: cache.transaction
      })

      if (!deviceEntryUnsafe) {
        throw new ParentDeviceActionWithoutParentDeviceException()
      }

      // this ensures that the parent exists
      await cache.getSecondPasswordHashOfParent(action.userId)

      return {
        isChildLimitAdding: false,
        authentication: 'device'
      }
    } else if (action.integrity === 'childDevice') {
      return {
        isChildLimitAdding: true, // will be checked later
        authentication: 'device'
      }
    } else if (action.integrity.startsWith('u2f:')) {
      // this ensures that the parent exists
      await cache.getSecondPasswordHashOfParent(action.userId)

      try {
        const checkResult = await validateU2fIntegrity({
          integrity: action.integrity,
          hasFullVersion: cache.hasFullVersion,
          familyId: cache.familyId,
          deviceId,
          database: cache.database,
          transaction: cache.transaction,
          calculateHmac: (secret) => calculateActionHmac({
            action,
            deviceId,
            secret
          })
        })

        if (checkResult.userId !== action.userId) {
          throw new InvalidParentActionIntegrityValue()
        }
      } catch (ex) {
        if (ex instanceof U2fValidationError) throw new InvalidU2fIntegrityValue(ex.message)
        else throw ex
      }

      return {
        isChildLimitAdding: false,
        authentication: 'u2f'
      }
    } else if (action.integrity.startsWith('password:')) {
      // password method with hmac
      const parentSecondHash = await cache.getSecondPasswordHashOfParent(action.userId)

      const correctResponse = calculateActionHmac({
        action,
        deviceId,
        secret: Buffer.from(parentSecondHash, 'utf8')
      })

      const providedResult = Buffer.from(action.integrity.substring(9), 'base64')

      if (!timingSafeEqual(providedResult, correctResponse)) {
        throw new InvalidParentActionIntegrityValue()
      }

      return {
        isChildLimitAdding: false,
        authentication: 'password'
      }
    } else {
      // legacy password method
      const parentSecondHash = await cache.getSecondPasswordHashOfParent(action.userId)

      const integrityData = action.sequenceNumber.toString(10) +
                  deviceId +
                  parentSecondHash +
                  action.encodedAction

      const expectedIntegrityValue = createHash('sha512').update(integrityData).digest('hex')

      if (action.integrity !== expectedIntegrityValue) {
        throw new InvalidParentActionIntegrityValue()
      }

      return {
        isChildLimitAdding: false,
        authentication: 'password'
      }
    }
  } else if (action.type === 'child') {
    const childSecondHash = await cache.getSecondPasswordHashOfChild(action.userId)

    const integrityData = action.sequenceNumber.toString(10) +
                deviceId +
                childSecondHash +
                action.encodedAction

    const expectedIntegrityValue = createHash('sha512').update(integrityData).digest('hex')

    if (action.integrity !== expectedIntegrityValue) {
      throw new InvalidChildActionIntegrityValue()
    }

    return {
      isChildLimitAdding: false,
      authentication: 'password'
    }
  } else {
    throw new ActionObjectTypeNotHandledException()
  }
}

function calculateActionHmac({ action, deviceId, secret }: {
  action: ClientPushChangesRequestAction
  deviceId: string
  secret: Buffer
}): Buffer {
  const binaryDeviceId = Buffer.from(deviceId, 'utf8')
  const binaryAction = Buffer.from(action.encodedAction, 'utf8')

  return createHmac('sha256', secret)
    .update(longToBuffer(BigInt(action.sequenceNumber)))
    .update(intToBuffer(binaryDeviceId.length))
    .update(binaryDeviceId)
    .update(intToBuffer(binaryAction.length))
    .update(binaryAction)
    .digest()
}
