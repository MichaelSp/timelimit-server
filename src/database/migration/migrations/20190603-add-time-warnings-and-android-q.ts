/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 Jonas Lochmann
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

import { QueryInterface, Sequelize } from 'sequelize'
import { attributes as categoryAttributes } from '../../category'
import { attributesVersion10 as deviceAttributes } from '../../device'

export async function up (queryInterface: QueryInterface, sequelize: Sequelize) {
  await sequelize.transaction({
    type: 'EXCLUSIVE'
  }, async (transaction) => {
    await queryInterface.addColumn('Devices', 'isQorLater', {
      ...deviceAttributes.isQorLater
    }, {
      transaction
    })

    await queryInterface.addColumn('Categories', 'timeWarningFlags', {
      ...categoryAttributes.timeWarningFlags
    }, {
      transaction
    })
  })
}

export async function down (queryInterface: QueryInterface, sequelize: Sequelize) {
  await sequelize.transaction({
    type: 'EXCLUSIVE'
  }, async (transaction) => {
    await queryInterface.removeColumn('Devices', 'isQorLater', { transaction })
    await queryInterface.removeColumn('Categories', 'timeWarningFlags', { transaction })
  })
}
