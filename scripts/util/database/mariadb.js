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

async function startMariadb() {
  try {
    await mkdirAsync(tempDir)
  } catch (ex) {
    /* ignore */
  }

  const instanceDir = resolve(tempDir, generateShortToken())
  const dataDir = resolve(instanceDir, "data")
  const socketPath = resolve(instanceDir, "socket")

  await rimrafAsync(instanceDir)
  await mkdirAsync(instanceDir)
  await mkdirAsync(dataDir)

  await spawnAsync(
    "mysql_install_db",
    ["--datadir=" + dataDir, "--user=" + process.env.USER],
    { stdio: "inherit" },
  )

  const task = await spawn(
    "mysqld_safe",
    [
      "--no-defaults",
      "--datadir=" + dataDir,
      "--socket=" + socketPath,
      "--skip-networking",
    ],
    { stdio: "inherit" },
  )
  task.on("exit", () => rimrafAsync(instanceDir))

  for (let i = 0; i < 100; i++) {
    const { status } = await spawnAsync("mysqladmin", [
      "ping",
      "-S",
      socketPath,
    ])

    if (status === 0) break

    await sleep(100)
  }

  const database = generateShortToken()
  const username = generateShortToken()
  const password = generateToken()

  const commands = [
    "CREATE DATABASE `" +
      database +
      "` DEFAULT CHARACTER SET `utf8mb4` COLLATE `utf8mb4_bin`",
    // all users of the system can see this password because it is passed as command
    // line parameter - don't do this for anything important
    "CREATE USER `" + username + "`@localhost IDENTIFIED BY '" + password + "'",
    "GRANT ALL PRIVILEGES ON `" +
      database +
      "`.* TO `" +
      username +
      "`@localhost",
  ]

  for (command of commands) {
    console.log(command)
    await spawnAsync("mysql", ["-S", socketPath, "-u", "root", "-e", command], {
      stdio: "inherit",
    })
  }

  return {
    shutdown: () => {
      spawnAsync("mysql", ["-S", socketPath, "-u", "root", "-e", "SHUTDOWN;"], {
        stdio: "inherit",
      }).catch((ex) => {
        console.warn(ex)
      })
    },
    socketPath,
    dataDir,
    database,
    username,
    password,
    connectionUrl:
      "mariadb://" +
      username +
      ":" +
      password +
      "@localhost/" +
      database +
      "?socketPath=" +
      encodeURIComponent(socketPath),
    type: "mariadb",
  }
}

module.exports = { startMariadb }
