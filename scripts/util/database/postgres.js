/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2021 Jonas Lochmann
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

const { resolve } = require("path")
const { spawn } = require("child_process")
const { tempDir } = require("./helper.js")
const { generateShortToken, generateToken } = require("../token.js")
const {
  rimrafAsync,
  mkdirAsync,
  readFileAsync,
  writeFileAsync,
} = require("../filesystem.js")
const { spawnAsync } = require("../process.js")
const { sleep } = require("../sleep.js")

async function startPostgres() {
  try {
    await mkdirAsync(tempDir)
  } catch (ex) {
    /* ignore */
  }

  const instanceDir = resolve(tempDir, generateShortToken())
  const dataDir = resolve(instanceDir, "data")
  const socketDir = resolve(instanceDir, "socket")

  await rimrafAsync(instanceDir)
  await mkdirAsync(instanceDir)
  await mkdirAsync(dataDir)
  await mkdirAsync(socketDir)

  await spawnAsync(
    "initdb",
    ["--locale=en_US.UTF-8", "-E", " UTF8", "-D", dataDir],
    { stdio: "inherit" },
  )

  const configFilePath = resolve(dataDir, "postgresql.conf")
  const configFileContent =
    (await readFileAsync(configFilePath)) +
    "\n" +
    "unix_socket_directories = '" +
    socketDir +
    "'" +
    "\n" +
    "listen_addresses = '' # do not listen using TCP"

  await writeFileAsync(configFilePath, configFileContent)

  const task = spawn("postgres", ["-D", dataDir], { stdio: "inherit" })
  task.on("exit", () => rimrafAsync(instanceDir))

  for (let i = 0; i < 100; i++) {
    const { status } = await spawnAsync("pg_isready", ["-h", socketDir])

    if (status === 0) break

    await sleep(100)
  }

  const database = generateShortToken()
  const username = generateShortToken()
  const password = generateToken() // this database accepts anything

  await spawnAsync("createuser", ["-h", socketDir, username], {
    stdio: "inherit",
  })
  await spawnAsync("createdb", ["-h", socketDir, database], {
    stdio: "inherit",
  })

  return {
    shutdown: () => task.kill("SIGINT"),
    socketDir,
    dataDir,
    database,
    username,
    password,
    connectionUrl:
      "postgres://" +
      username +
      ":" +
      password +
      "@localhost/" +
      database +
      "?host=" +
      encodeURIComponent(socketDir),
    type: "postgres",
  }
}

module.exports = { startPostgres }
