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

import { SetDeviceUserAction, SignOutAtDeviceAction } from '../../../../action'
import { Cache } from '../cache'
import { dispatchSetDeviceUser } from '../dispatch-parent-action/setdeviceuser'
import { IllegalStateException, SourceDeviceNotFoundException } from '../exception/illegal-state'
import { PremiumVersionMissingException } from '../exception/premium'

export async function dispatchSignOutAtDevice ({ deviceId, cache }: {
  deviceId: string
  action: SignOutAtDeviceAction
  cache: Cache
}) {
  if (!cache.hasFullVersion) {
    throw new PremiumVersionMissingException()
  }

  const deviceEntry = await cache.database.device.findOne({
    where: {
      familyId: cache.familyId,
      deviceId
    },
    transaction: cache.transaction
  })

  if (!deviceEntry) {
    throw new SourceDeviceNotFoundException()
  }

  if (deviceEntry.defaultUserId === '') {
    throw new IllegalStateException({
      staticMessage: 'tried to switch to the default user where it does not exist'
    })
  }

  if (deviceEntry.currentUserId !== deviceEntry.defaultUserId) {
    await dispatchSetDeviceUser({
      cache,
      action: new SetDeviceUserAction({
        deviceId,
        userId: deviceEntry.defaultUserId
      })
    })
  }
}
