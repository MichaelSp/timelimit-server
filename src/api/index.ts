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


import auth from 'basic-auth'
import express from 'express'
import { VisibleConnectedDevicesManager } from '../connected-devices'
import { Database } from '../database'
import { EventHandler } from '../monitoring/eventhandler'
import { WebsocketApi } from '../websocket'
import { createAdminRouter } from './admin'
import { createAuthRouter } from './auth'
import { createChildRouter } from './child'
import { createParentRouter } from './parent'
import { createPurchaseRouter } from './purchase'
import { createSyncRouter } from './sync'

const adminToken = process.env.ADMIN_TOKEN || ''

export const createApi = ({ database, websocket, connectedDevicesManager, eventHandler }: {
  database: Database
  websocket: WebsocketApi
  connectedDevicesManager: VisibleConnectedDevicesManager
  eventHandler: EventHandler
}) => {
  const app = express()

  app.disable('x-powered-by')

  app.get('/time', (_, res) => {
    res.json({
      ms: Date.now()
    })
  })

  app.use('/auth', createAuthRouter(database))
  app.use('/child', createChildRouter({ database, websocket, eventHandler }))
  app.use('/parent', createParentRouter({ database, websocket, eventHandler }))
  app.use('/purchase', createPurchaseRouter({ database, websocket }))
  app.use('/sync', createSyncRouter({ database, websocket, connectedDevicesManager, eventHandler }))

  app.use(
    '/admin',
    (req, res, next) => {
      // required for webbrowser CORS support
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
      res.header('Access-Control-Allow-Methods', 'GET, POST')

      // without it, browsers ignore the cors headers
      if (req.method === 'OPTIONS') {
        res.sendStatus(204)

        return
      }

      const user = auth(req)

      if (adminToken !== '' && user && user.pass === adminToken) {
        next()
      } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="login"')
        res.sendStatus(401)
      }
    },
    createAdminRouter({ database, websocket, eventHandler })
  )

  return app
}
