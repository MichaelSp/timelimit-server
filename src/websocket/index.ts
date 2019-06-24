/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 Jonas Lochmann
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

import * as EventEmitter from 'events'
import * as io from 'socket.io'
import { ConnectedDevicesManager, VisibleConnectedDevicesManager } from '../connected-devices'
import { Database } from '../database'
import { deviceByAuthTokenRoom } from './rooms'

export const createWebsocketHandler = ({ connectedDevicesManager, database }: {
  connectedDevicesManager: VisibleConnectedDevicesManager
  database: Database
}): {
  websocketServer: io.Server
  websocketApi: WebsocketApi
} => {
  const events = new EventEmitter()

  // this disables warnings for many listeners
  // this is required because very single socket causes listeners
  events.setMaxListeners(0)

  const eventTriggerImportantSyncForAll = 'triggerimportantsyncforall'

  let socketCounter = 0
  const server = io()

  server.on('connection', (socket) => {
    socketCounter++
    socket.on('disconnect', () => socketCounter--)

    socket.on('devicelogin', (deviceAuthToken: any, ack: any) => {
      socket.leaveAll()

      if (typeof deviceAuthToken !== 'string') {
        return
      }

      socket.join(deviceByAuthTokenRoom(deviceAuthToken))

      const importantSyncForAllListener = () => {
        setTimeout(() => {
          socket.connected && socket.emit('should sync', { isImportant: true })
        }, Math.random() * 1000 * 60 /* wait up to one minute */)
      }

      events.on(eventTriggerImportantSyncForAll, importantSyncForAllListener)
      socket.on('disconnect', () => events.removeListener(eventTriggerImportantSyncForAll, importantSyncForAllListener))

      ;(async () => {
        const deviceEntryUnsafe = await database.device.findOne({
          where: {
            deviceAuthToken
          },
          attributes: ['familyId', 'deviceId']
        })

        if (deviceEntryUnsafe && socket.connected) {
          const deviceEntry = {
            familyId: deviceEntryUnsafe.familyId,
            deviceId: deviceEntryUnsafe.deviceId
          }

          const key = ConnectedDevicesManager.buildKey({
            familyId: deviceEntry.familyId,
            deviceId: deviceEntry.deviceId
          })

          connectedDevicesManager.connectedDevicesManager.reportDeviceConnected({ key })
          const { shutdown } = connectedDevicesManager.observeConnectedDevicesOfFamily({
            familyId: deviceEntry.familyId,
            listener: (connectedDevices) => {
              socket.emit('connected devices', connectedDevices)
            }
          })

          socket.on('disconnect', () => {
            connectedDevicesManager.connectedDevicesManager.reportDeviceDisconnected({ key })
            shutdown()
          })
        }
      })().catch((ex) => { /* ignore */ })

      if (typeof ack === 'function') {
        ack()
      }
    })
  })

  const websocketApi: WebsocketApi = {
    triggerSyncByDeviceAuthToken: ({ deviceAuthToken, isImportant }: {deviceAuthToken: string, isImportant: boolean}) => {
      server
        .to(deviceByAuthTokenRoom(deviceAuthToken))
        .emit('should sync', { isImportant })
    },
    triggerLogoutByDeviceAuthToken: ({ deviceAuthToken }: {deviceAuthToken: string}) => {
      server
        .to(deviceByAuthTokenRoom(deviceAuthToken))
        .emit('sign out')
    },
    triggerImportantSyncAtAllDevicesInBackground: () => {
      events.emit(eventTriggerImportantSyncForAll)
    },
    countConnections: () => socketCounter
  }

  return {
    websocketServer: server,
    websocketApi
  }
}

export interface WebsocketApi {
  triggerSyncByDeviceAuthToken: (params: {deviceAuthToken: string, isImportant: boolean}) => void
  triggerLogoutByDeviceAuthToken: (params: {deviceAuthToken: string}) => void
  triggerImportantSyncAtAllDevicesInBackground: () => void
  countConnections: () => number
}
