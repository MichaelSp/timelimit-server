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

const { spawn } = require("child_process")
const { resolve } = require("path")

function startMainApp(env) {
  const initPath = resolve(__dirname, "../../build/index.js")

  return new Promise((resolve, reject) => {
    const task = spawn("node", [initPath], {
      stdio: ["inherit", "pipe", "inherit"],
      env: { ...process.env, PORT: 0 /* random port */, ...env },
    })

    task.on("exit", () => reject(new Error("task terminated too early")))
    task.on("error", (ex) => reject(ex))

    task.stdout.on("data", (data) => {
      if (data.toString("utf8").split("\n").indexOf("ready") !== -1)
        resolve(task)

      process.stdout.write(data)
    })

    setTimeout(() => {
      reject(new Error("timeout"))

      task.kill("SIGINT")
    }, 1000 * 30)
  }).then((task) => {
    return {
      shutdown: () => task.kill("SIGINT"),
    }
  })
}

module.exports = { startMainApp }
