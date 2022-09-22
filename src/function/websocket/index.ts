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

import { Database, Transaction } from '../../database'
import { WebsocketApi } from '../../websocket'

export const notifyClientsAboutChangesDelayed = async ({
  familyId, sourceDeviceId, database,
  websocket, transaction, generalLevel, targetedLevels
}: {
  familyId: string
  sourceDeviceId: string | null  // this device will not get an push
  database: Database
  websocket: WebsocketApi
  transaction: Transaction
  generalLevel: 0 | 1 | 2
  targetedLevels: Map<string, 0 | 1 | 2>
}) => {
  const relatedDeviceEntries = (await database.device.findAll({
    where: {
      familyId
    },
    attributes: ['deviceId', 'deviceAuthToken'],
    transaction
  })).map((item) => ({
    deviceId: item.deviceId,
    deviceAuthToken: item.deviceAuthToken
  }))

  transaction.afterCommit(() => {
    for (const deviceEntry of relatedDeviceEntries) {
      if (deviceEntry.deviceId === sourceDeviceId) continue

      const targetedLevel = targetedLevels.get(deviceEntry.deviceId) ?? 0
      const effectiveLevel = Math.max(targetedLevel, generalLevel)

      if (effectiveLevel > 0) {
        websocket.triggerSyncByDeviceAuthToken({
          deviceAuthToken: deviceEntry.deviceAuthToken,
          isImportant: effectiveLevel === 2
        })
      }
    }
  })
}
