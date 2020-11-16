/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2020 Jonas Lochmann
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

import * as Sequelize from 'sequelize'
import { familyIdColumn, idWithinFamilyColumn, timestampColumn } from './columns'
import { SequelizeAttributes } from './types'

export interface ChildTaskAttributes {
  familyId: string
  taskId: string
  // end of primary key
  categoryId: string
  taskTitle: string
  extraTimeDuration: number
  pendingRequest: number
  lastGrantTimestamp: string
}

export const maxExtraTime = 1000 * 60 * 60 * 24
export const maxTitleLength = 50

export type ChildTaskModel = Sequelize.Model & ChildTaskAttributes
export type ChildTaskModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): ChildTaskModel;
}

export const attributes: SequelizeAttributes<ChildTaskAttributes> = {
  familyId: {
    ...familyIdColumn,
    primaryKey: true
  },
  taskId: {
    ...idWithinFamilyColumn,
    primaryKey: true
  },
  categoryId: { ...idWithinFamilyColumn },
  taskTitle: {
    type: Sequelize.STRING(maxTitleLength),
    allowNull: false
  },
  extraTimeDuration: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: { min: 1, max: maxExtraTime }
  },
  pendingRequest: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  lastGrantTimestamp: { ...timestampColumn }
}

export const createChildTaskModel = (sequelize: Sequelize.Sequelize): ChildTaskModelStatic => sequelize.define('ChildTask', attributes) as ChildTaskModelStatic
