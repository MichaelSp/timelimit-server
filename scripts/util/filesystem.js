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

const { mkdir, readFile, writeFile } = require("fs")

function mkdirAsync(path) {
  return new Promise((resolve, reject) => {
    mkdir(path, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    readFile(path, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

function writeFileAsync(path, content) {
  return new Promise((resolve, reject) => {
    writeFile(path, content, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports = { mkdirAsync, readFileAsync, writeFileAsync }
