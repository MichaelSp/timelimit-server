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

import { Database } from '../../database'
import { generateAuthToken, generateVersionId } from '../../util/token'
import { WebsocketApi } from '../../websocket'
import { sendUninstallWarnings } from '../warningmail/uninstall'
import { notifyClientsAboutChangesDelayed } from '../websocket'

export async function reportDeviceRemoved ({ database, deviceAuthToken, websocket }: {
  database: Database
  deviceAuthToken: string
  websocket: WebsocketApi
  // no transaction here because this is directly called from an API endpoint
}) {
  await database.transaction(async (transaction) => {
    const deviceEntry = await database.device.findOne({
      where: {
        deviceAuthToken
      },
      transaction
    })

    if (deviceEntry) {
      const currentAuthToken = deviceEntry.deviceAuthToken

      deviceEntry.didDeviceReportUninstall = true
      deviceEntry.deviceAuthToken = generateAuthToken() // invalidiate the token
      deviceEntry.save({ transaction })

      // invalidiate device list
      await database.family.update({
        deviceListVersion: generateVersionId()
      }, {
        where: {
          familyId: deviceEntry.familyId
        },
        transaction
      })

      // add to old devices
      await database.oldDevice.create({
        deviceAuthToken: currentAuthToken
      }, {
        transaction
      })

      await notifyClientsAboutChangesDelayed({
        database,
        websocket,
        familyId: deviceEntry.familyId,
        sourceDeviceId: null,
        isImportant: false,
        transaction
      })

      await sendUninstallWarnings({
        database,
        familyId: deviceEntry.familyId,
        deviceName: deviceEntry.name,
        transaction
      })
    } else {
      const oldDeviceEntry = await database.oldDevice.findOne({
        where: {
          deviceAuthToken
        },
        transaction
      })

      if (!oldDeviceEntry) {
        throw new Error('device not found')
      }
    }
  })
}
