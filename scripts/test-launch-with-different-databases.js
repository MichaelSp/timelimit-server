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

const { databaseLaunchers } = require("./util/database")
const { startMainApp } = require("./util/mainapp.js")

// use export PATH="$PATH:/usr/lib/postgresql/11/bin"
// if the postgres binaries are not in the path

async function main() {
  let log = ""

  for (const launcher of databaseLaunchers) {
    const database = await launcher()

    console.log("Test with " + database.type)

    try {
      const task = await startMainApp({
        DATABASE_URL: database.connectionUrl,
      })

      console.log("test successfull")
      log += "Worked with " + database.type + "\n"

      task.shutdown()
    } catch (ex) {
      log += "Failure with " + database.type + "\n"
      console.warn("test failed", ex)
    }

    database.shutdown()
  }

  console.log("\nRESULTS\n\n" + log)
  process.exit(0)
}

main().catch((ex) => {
  console.warn(ex)
})
