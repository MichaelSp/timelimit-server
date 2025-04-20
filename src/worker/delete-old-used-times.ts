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

import { uniqBy } from "lodash"
import * as Sequelize from "sequelize"
import { Database } from "../database/index.js"
import { generateVersionId } from "../util/token.js"

export function initDeleteOldUsedTimesWorker({
  database,
}: {
  database: Database
}) {
  function doWorkSafe() {
    console.log("deleting old used times now")

    deleteOldUsedTimes({ database })
      .then(() => {
        console.log("finished deleting old used times")
      })
      .catch((ex) => {
        console.warn("error deleting old used times", ex)
      })
  }

  setTimeout(
    () => {
      doWorkSafe()

      setInterval(
        () => {
          doWorkSafe()
        },
        1000 * 60 * 30 /* every 30 minutes */,
      )
    },
    1000 * 60 * 13 /* after 13 minutes */,
  )
}

async function deleteOldUsedTimes({ database }: { database: Database }) {
  const now = Date.now()

  await database.transaction(async (transaction) => {
    // get matching categories
    const categoriesToCleanUpOne = (
      await database.usedTime.findAll({
        transaction,
        where: {
          lastUpdate: {
            [Sequelize.Op.lt]: (now - 1000 * 60 * 60 * 24 * 10) /* 10 days */
              .toString(),
          },
        },
        attributes: ["familyId", "categoryId"],
        limit: 1000,
        order: [["lastUpdate", "ASC"]],
      })
    ).map((item) => ({
      familyId: item.familyId,
      categoryId: item.categoryId,
    }))

    const categoriesToCleanUpTwo = (
      await database.sessionDuration.findAll({
        transaction,
        where: {
          roundedLastUpdate: {
            [Sequelize.Op.lt]: (now - 1000 * 60 * 60 * 24 * 3) /* 3 days */
              .toString(),
          },
        },
        attributes: ["familyId", "categoryId"],
        limit: 1000,
        order: [["roundedLastUpdate", "ASC"]],
      })
    ).map((item) => ({
      familyId: item.familyId,
      categoryId: item.categoryId,
    }))

    const categoriesToCleanUp = [
      ...categoriesToCleanUpOne,
      ...categoriesToCleanUpTwo,
    ]

    const distinctCategoriesToCleanUp = uniqBy(
      categoriesToCleanUp,
      (item) => item.familyId + "_" + item.categoryId,
    )

    if (distinctCategoriesToCleanUp.length > 0) {
      // delete old items of matching categories
      await database.usedTime.destroy({
        transaction,
        where: {
          [Sequelize.Op.or]: distinctCategoriesToCleanUp,
          lastUpdate: {
            [Sequelize.Op.lt]: (now - 1000 * 60 * 60 * 24 * 10) /* 10 days */
              .toString(),
          },
        },
      })

      await database.sessionDuration.destroy({
        transaction,
        where: {
          [Sequelize.Op.or]: distinctCategoriesToCleanUp,
          roundedLastUpdate: {
            [Sequelize.Op.lt]: (now - 1000 * 60 * 60 * 24 * 3) /* 3 days */
              .toString(),
          },
        },
      })

      // invalidiate categories
      await database.category.update(
        {
          usedTimesVersion: generateVersionId(),
        },
        {
          transaction,
          where: {
            [Sequelize.Op.or]: distinctCategoriesToCleanUp,
          },
        },
      )
    }
  })
}
