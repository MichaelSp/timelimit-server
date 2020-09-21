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

import { assertIdWithinFamily } from '../util/token'
import { ParentAction } from './basetypes'

export class SetDeviceDefaultUserAction extends ParentAction {
  readonly deviceId: string
  readonly defaultUserId: string

  constructor ({ deviceId, defaultUserId }: {
    deviceId: string
    defaultUserId: string
  }) {
    super()

    assertIdWithinFamily(deviceId)

    if (defaultUserId !== '') {
      assertIdWithinFamily(defaultUserId)
    }

    this.deviceId = deviceId
    this.defaultUserId = defaultUserId
  }

  static parse = ({ deviceId, defaultUserId }: SerializedSetDeviceDefaultUserAction) => (
    new SetDeviceDefaultUserAction({ deviceId, defaultUserId })
  )
}

export interface SerializedSetDeviceDefaultUserAction {
  type: 'SET_DEVICE_DEFAULT_USER'
  deviceId: string
  defaultUserId: string
}
