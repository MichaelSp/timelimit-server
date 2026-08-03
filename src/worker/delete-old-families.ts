/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
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

import { SimpleDatabase } from '../database/simple'
import { deleteOldFamilies } from '../function/cleanup/delete-old-families'

export function initDeleteOldFamiliesWorker ({ database }: {
  database: SimpleDatabase
}) {
  function doWorkSafe () {
    console.log('deleting old families now')

    deleteOldFamilies(database).then(() => {
      console.log('finished deleting old families')
    }).catch((ex) => {
      console.warn('error deleting old families', ex)
    })
  }

  setTimeout(() => {
    doWorkSafe()

    setInterval(() => {
      doWorkSafe()
    }, 1000 * 60 * 60 /* every 4 hours */)
  }, 1000 * 60 * 23 /* after 23 minutes */)
}
