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

import * as basicAuth from 'basic-auth'
import * as express from 'express'
import { VisibleConnectedDevicesManager } from '../connected-devices'
import { Database } from '../database'
import { WebsocketApi } from '../websocket'
import { createAdminRouter } from './admin'
import { createAuthRouter } from './auth'
import { createChildRouter } from './child'
import { createParentRouter } from './parent'
import { createPurchaseRouter } from './purchase'
import { createSyncRouter } from './sync'

const adminToken = process.env.ADMIN_TOKEN || ''

export const createApi = ({ database, websocket, connectedDevicesManager }: {
  database: Database
  websocket: WebsocketApi
  connectedDevicesManager: VisibleConnectedDevicesManager
}) => {
  const app = express()

  app.disable('x-powered-by')

  app.get('/time', (req, res) => {
    res.json({
      ms: Date.now()
    })
  })

  app.use('/auth', createAuthRouter(database))
  app.use('/child', createChildRouter({ database, websocket }))
  app.use('/parent', createParentRouter({ database, websocket }))
  app.use('/purchase', createPurchaseRouter({ database, websocket }))
  app.use('/sync', createSyncRouter({ database, websocket, connectedDevicesManager }))

  app.use(
    '/admin',
    (req, res, next) => {
      const user = basicAuth(req)

      if (adminToken !== '' && user && user.pass === adminToken) {
        next()
      } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="login"')
        res.sendStatus(401)
      }
    },
    createAdminRouter({ database, websocket })
  )

  return app
}
