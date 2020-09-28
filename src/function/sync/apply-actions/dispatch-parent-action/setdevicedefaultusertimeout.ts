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

import { SetDeviceDefaultUserTimeoutAction } from '../../../../action'
import { Cache } from '../cache'
import { MissingDeviceException } from '../exception/missing-item'

export async function dispatchSetDeviceDefaultUserTimeout ({ action, cache }: {
  action: SetDeviceDefaultUserTimeoutAction
  cache: Cache
}) {
  const oldDeviceItem = await cache.database.device.findOne({
    transaction: cache.transaction,
    where: {
      familyId: cache.familyId,
      deviceId: action.deviceId
    }
  })

  if (!oldDeviceItem) {
    throw new MissingDeviceException()
  }

  await cache.database.device.update({
    defaultUserTimeout: action.timeout
  }, {
    transaction: cache.transaction,
    where: {
      familyId: cache.familyId,
      deviceId: action.deviceId
    }
  })

  cache.invalidiateDeviceList = true
  cache.areChangesImportant = true
}
