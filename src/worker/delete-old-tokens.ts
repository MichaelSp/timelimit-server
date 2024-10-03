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

import * as Sequelize from "sequelize"
import { Database } from "../database"

export function initDeleteOldTokensWorker({
  database,
}: {
  database: Database
}) {
  function doWorkSafe() {
    console.log("deleting old tokens now")

    deleteOldTokens({ database })
      .then(() => {
        console.log("finished deleting old tokens")
      })
      .catch((ex) => {
        console.warn("error deleting old tokens", ex)
      })
  }

  setTimeout(
    () => {
      doWorkSafe()

      setInterval(
        () => {
          doWorkSafe()
        },
        1000 * 60 * 60 /* every hour */,
      )
    },
    1000 * 60 * 7 /* after 7 minutes */,
  )
}

async function deleteOldTokens({ database }: { database: Database }) {
  await database.transaction(async (transaction) => {
    await database.authtoken.destroy({
      where: {
        createdAt: {
          [Sequelize.Op.lt]: (Date.now() - 1000 * 60 * 60 * 3) /* 3 hours */
            .toString(),
        },
      },
      transaction,
    })

    await database.addDeviceToken.destroy({
      where: {
        createdAt: {
          [Sequelize.Op.lt]: (Date.now() - 1000 * 60 * 60 * 3) /* 3 hours */
            .toString(),
        },
      },
      transaction,
    })

    await database.mailLoginToken.destroy({
      where: {
        createdAt: {
          [Sequelize.Op.lt]: (Date.now() - 1000 * 60 * 60 * 3) /* 3 hours */
            .toString(),
        },
      },
      transaction,
    })
  })

  await database.deviceDhKey.destroy({
    where: {
      expireAt: {
        [Sequelize.Op.lt]: Date.now().toString(),
      },
    },
  })
}
