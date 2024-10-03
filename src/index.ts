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

import { Server } from "http"
import { pid } from "process"
import { createApi } from "./api"
import { config } from "./config"
import { VisibleConnectedDevicesManager } from "./connected-devices"
import {
  assertNestedTransactionsAreWorking,
  assertSerializeableTransactionsAreWorking,
  defaultDatabase,
  defaultUmzug,
} from "./database"
import { EventHandler } from "./monitoring/eventhandler"
import { InMemoryEventHandler } from "./monitoring/inmemoryeventhandler"
import { createWebsocketHandler } from "./websocket"
import { initWorkers } from "./worker"

async function main() {
  await defaultUmzug.up()
  const database = defaultDatabase
  const eventHandler: EventHandler = new InMemoryEventHandler()

  await assertNestedTransactionsAreWorking(database)
  await assertSerializeableTransactionsAreWorking(database)

  const connectedDevicesManager = new VisibleConnectedDevicesManager({
    database,
  })

  const { websocketApi, websocketServer } = createWebsocketHandler({
    database,
    connectedDevicesManager,
  })

  initWorkers({
    websocket: websocketApi,
    database,
  })

  const api = createApi({
    database,
    websocket: websocketApi,
    connectedDevicesManager,
    eventHandler,
  })

  const server = new Server(api)

  websocketServer.attach(server, {
    serveClient: false,
    pingInterval: config.pingInterval,
  })

  const port = process.env.PORT || 8080

  if (port === "socketactivation") {
    if (process.env.LISTEN_FDS !== "1") {
      console.warn(
        "expecting exactly one file descriptor for the socket activation",
      )
      process.exit(1)
    } else if (process.env.LISTEN_PID !== pid.toString(10)) {
      console.warn(
        "expecting handover of file descriptors to this process for the socket activation",
      )
      process.exit(1)
    }

    // the sockets are passed using fd 3 + index (with index = 0 in this case)
    server.listen({ fd: 3 })
  } else {
    server.listen(port)
  }

  console.log("ready")
}

main().catch((ex) => {
  console.warn(ex)
  process.exit(1)
})
