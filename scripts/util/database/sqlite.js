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

async function startSqlite() {
  try {
    await mkdirAsync(tempDir)
  } catch (ex) {
    /* ignore */
  }

  const instanceDir = resolve(tempDir, generateShortToken())

  await rimrafAsync(instanceDir)
  await mkdirAsync(instanceDir)

  return {
    shutdown: () => rimrafAsync(instanceDir),
    instanceDir,
    connectionUrl: "sqlite:///" + instanceDir + "/test.db",
    type: "sqlite",
  }
}

module.exports = { startSqlite }
