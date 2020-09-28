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
import { ValidationException } from '../exception'
import { MinuteOfDay } from '../util/minuteofday'
import { booleanColumn, familyIdColumn, idWithinFamilyColumn } from './columns'
import { SequelizeAttributes } from './types'

interface TimelimitRuleAttributesVersion1 {
  familyId: string
  ruleId: string
  categoryId: string
  applyToExtraTimeUsage: boolean
  dayMaskAsBitmask: number
  maximumTimeInMillis: number
}

interface TimelimitRuleAttributesVersion2 {
  startMinuteOfDay: number
  endMinuteOfDay: number
  sessionDurationMilliseconds: number
  sessionPauseMilliseconds: number
}

type TimelimitRuleAttributes = TimelimitRuleAttributesVersion1 & TimelimitRuleAttributesVersion2

export type TimelimitRuleModel = Sequelize.Model & TimelimitRuleAttributes
export type TimelimitRuleModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): TimelimitRuleModel;
}

export const attributesVersion1: SequelizeAttributes<TimelimitRuleAttributesVersion1> = {
  familyId: {
    ...familyIdColumn,
    primaryKey: true
  },
  ruleId: {
    ...idWithinFamilyColumn,
    primaryKey: true
  },
  categoryId: { ...idWithinFamilyColumn },
  applyToExtraTimeUsage: { ...booleanColumn },
  dayMaskAsBitmask: {
    type: Sequelize.TINYINT,
    allowNull: false,
    validate: {
      min: 0,
      max: 1 | 2 | 4 | 8 | 16 | 32 | 64
    }
  },
  maximumTimeInMillis: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}

export const attributesVersion2: SequelizeAttributes<TimelimitRuleAttributesVersion2> = {
  startMinuteOfDay: {
    type: Sequelize.INTEGER,
    validate: {
      min: MinuteOfDay.MIN,
      max: MinuteOfDay.MAX
    },
    allowNull: false,
    defaultValue: MinuteOfDay.MIN
  },
  endMinuteOfDay: {
    type: Sequelize.INTEGER,
    validate: {
      min: MinuteOfDay.MIN,
      max: MinuteOfDay.MAX,
      customValidator (endMinuteOfDay: unknown) {
        const startMinuteOfDay = this.startMinuteOfDay

        if (typeof endMinuteOfDay !== 'number' || typeof startMinuteOfDay !== 'number') {
          throw new ValidationException({ staticMessage: 'wrong data types for start and end minute at the time limit rule' })
        }

        if (startMinuteOfDay > endMinuteOfDay) {
          throw new ValidationException({ staticMessage: 'startMinuteOfDay must not be bigger than endMinuteOfDay for a time limit rule' })
        }
      }
    },
    allowNull: false,
    defaultValue: MinuteOfDay.MAX
  },
  sessionDurationMilliseconds: {
    type: Sequelize.INTEGER,
    validate: {
      min: 0
    },
    allowNull: false,
    defaultValue: 0
  },
  sessionPauseMilliseconds: {
    type: Sequelize.INTEGER,
    validate: {
      min: 0
    },
    allowNull: false,
    defaultValue: 0
  }
}

export const attributes: SequelizeAttributes<TimelimitRuleAttributes> = {
  ...attributesVersion1,
  ...attributesVersion2
}

export const createTimelimitRuleModel = (sequelize: Sequelize.Sequelize): TimelimitRuleModelStatic => sequelize.define('TimelimitRule', attributes) as TimelimitRuleModelStatic
