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

import * as Sequelize from 'sequelize'
import { AppRecommendation, appRecommendationValues } from '../model/apprecommendation'
import { booleanColumn, createEnumColumn, familyIdColumn, idWithinFamilyColumn, optionalLabelColumn } from './columns'
import { SequelizeAttributes } from './types'

export interface AppAttributes {
  familyId: string
  deviceId: string
  packageName: string
  title: string
  isLaunchable: boolean
  recommendation: AppRecommendation
}

export type AppInstance = Sequelize.Instance<AppAttributes> & AppAttributes
export type AppModel = Sequelize.Model<AppInstance, AppAttributes>

export const attributes: SequelizeAttributes<AppAttributes> = {
  familyId: {
    ...familyIdColumn,
    primaryKey: true
  },
  deviceId: {
    ...idWithinFamilyColumn,
    primaryKey: true
  },
  packageName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    primaryKey: true
  },
  title: { ...optionalLabelColumn },
  isLaunchable: { ...booleanColumn },
  recommendation: createEnumColumn(appRecommendationValues)
}

export const createAppModel = (sequelize: Sequelize.Sequelize): AppModel => sequelize.define<AppInstance, AppAttributes>('App', attributes)
