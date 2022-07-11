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

import * as Sequelize from 'sequelize'
import { NewPermissionStatus, newPermissionStatusValues } from '../model/newpermissionstatus'
import { ProtectionLevel, protetionLevels } from '../model/protectionlevel'
import { RuntimePermissionStatus, runtimePermissionStatusValues } from '../model/runtimepermissionstatus'
import { authTokenColumn, booleanColumn, createEnumColumn, familyIdColumn, idWithinFamilyColumn, labelColumn, optionalIdWithinFamilyColumn, timestampColumn, versionColumn } from './columns'
import { SequelizeAttributes } from './types'

export const DeviceHadManipulationFlags = {
  ProtectionLevel: 1,
  UsageStatsAccess: 2,
  NotificationAccess: 4,
  AppVersion: 8,
  OverlayPermission: 16,
  AccessibiityService: 32,
  ALL: 1 | 2 | 4 | 8 | 16 | 32
}

export const DeviceManipulationFlags = {
  USED_FGS_KILLER: 1,
  ALL: 1
}

export interface DeviceAttributesVersion1 {
  familyId: string
  deviceId: string
  name: string
  model: string
  addedAt: string
  currentUserId: string
  installedAppsVersion: string
  deviceAuthToken: string
  networkTime: 'disabled' | 'if possible' | 'enabled'
  nextSequenceNumber: number
  currentProtectionLevel: ProtectionLevel
  highestProtectionLevel: ProtectionLevel
  currentUsageStatsPermission: RuntimePermissionStatus
  highestUsageStatsPermission: RuntimePermissionStatus
  currentNotificationAccessPermission: NewPermissionStatus
  highestNotificationAccessPermission: NewPermissionStatus
  currentAppVersion: number
  highestAppVersion: number
  triedDisablingDeviceAdmin: boolean
  hadManipulation: boolean
}

export interface DeviceAttributesVersion2 {
  lastConnectivity: string
  notSeenForLongTime: boolean
  didDeviceReportUninstall: boolean
}

export interface DeviceAttributesVersion3 {
  isUserKeptSignedIn: boolean
}

export interface DeviceAttributesVersion4 {
  showDeviceConnected: boolean
}

export interface DeviceAttributesVersion5 {
  defaultUserId: string
  defaultUserTimeout: number
}

export interface DeviceAttributesVersion6 {
  didReboot: boolean
  considerRebootManipulation: boolean
}

export interface DeviceAttributesVersion7 {
  currentOverlayPermission: RuntimePermissionStatus
  highestOverlayPermission: RuntimePermissionStatus
}

export interface DeviceAttributesVersion8 {
  // as = accessibility service
  asEnabled: boolean
  wasAsEnabled: boolean
}

export interface DeviceAttributesVersion9 {
  activityLevelBlocking: boolean
}

export interface DeviceAttributesVersion10 {
  isQorLater: boolean
}

export interface DeviceAttributesVersion11 {
  hadManipulationFlags: number
}

export interface DeviceAttributesVersion12 {
  manipulationFlags: number
}

export type DeviceAttributes = DeviceAttributesVersion1 & DeviceAttributesVersion2 &
  DeviceAttributesVersion3 & DeviceAttributesVersion4 & DeviceAttributesVersion5 &
  DeviceAttributesVersion6 & DeviceAttributesVersion7 & DeviceAttributesVersion8 &
  DeviceAttributesVersion9 & DeviceAttributesVersion10 & DeviceAttributesVersion11 &
  DeviceAttributesVersion12

export type DeviceModel = Sequelize.Model<DeviceAttributes> & DeviceAttributes
export type DeviceModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): DeviceModel;
}

export const attributesVersion1: SequelizeAttributes<DeviceAttributesVersion1> = {
  familyId: {
    ...familyIdColumn,
    primaryKey: true
  },
  deviceId: {
    ...idWithinFamilyColumn,
    primaryKey: true
  },
  name: { ...labelColumn },
  model: { ...labelColumn },
  addedAt: { ...timestampColumn },
  currentUserId: { ...optionalIdWithinFamilyColumn },
  installedAppsVersion: { ...versionColumn },
  deviceAuthToken: { ...authTokenColumn },
  networkTime: createEnumColumn(['disabled', 'if possible', 'enabled']),
  nextSequenceNumber: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  currentProtectionLevel: createEnumColumn(protetionLevels),
  highestProtectionLevel: createEnumColumn(protetionLevels),
  currentUsageStatsPermission: createEnumColumn(runtimePermissionStatusValues),
  highestUsageStatsPermission: createEnumColumn(runtimePermissionStatusValues),
  currentNotificationAccessPermission: createEnumColumn(newPermissionStatusValues),
  highestNotificationAccessPermission: createEnumColumn(newPermissionStatusValues),
  currentAppVersion: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  highestAppVersion: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  triedDisablingDeviceAdmin: { ...booleanColumn },
  hadManipulation: { ...booleanColumn }
}

export const attributesVersion2: SequelizeAttributes<DeviceAttributesVersion2> = {
  lastConnectivity: {
    ...timestampColumn,
    defaultValue: 0
  },
  notSeenForLongTime: {
    ...booleanColumn,
    defaultValue: false
  },
  didDeviceReportUninstall: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion3: SequelizeAttributes<DeviceAttributesVersion3> = {
  isUserKeptSignedIn: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion4: SequelizeAttributes<DeviceAttributesVersion4> = {
  showDeviceConnected: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion5: SequelizeAttributes<DeviceAttributesVersion5> = {
  defaultUserId: {
    ...optionalIdWithinFamilyColumn,
    defaultValue: ''
  },
  defaultUserTimeout: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}

export const attributesVersion6: SequelizeAttributes<DeviceAttributesVersion6> = {
  didReboot: {
    ...booleanColumn,
    defaultValue: false
  },
  considerRebootManipulation: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion7: SequelizeAttributes<DeviceAttributesVersion7> = {
  currentOverlayPermission: {
    ...createEnumColumn(runtimePermissionStatusValues),
    defaultValue: 'not granted'
  },
  highestOverlayPermission: {
    ...createEnumColumn(runtimePermissionStatusValues),
    defaultValue: 'not granted'
  }
}

export const attributesVersion8: SequelizeAttributes<DeviceAttributesVersion8> = {
  asEnabled: {
    ...booleanColumn,
    defaultValue: false
  },
  wasAsEnabled: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion9: SequelizeAttributes<DeviceAttributesVersion9> = {
  activityLevelBlocking: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion10: SequelizeAttributes<DeviceAttributesVersion10> = {
  isQorLater: {
    ...booleanColumn,
    defaultValue: false
  }
}

export const attributesVersion11: SequelizeAttributes<DeviceAttributesVersion11> = {
  hadManipulationFlags: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: DeviceHadManipulationFlags.ALL
    }
  }
}

export const attributesVersion12: SequelizeAttributes<DeviceAttributesVersion12> = {
  manipulationFlags: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: DeviceManipulationFlags.ALL
    }
  }
}

export const attributes: SequelizeAttributes<DeviceAttributes> = {
  ...attributesVersion1,
  ...attributesVersion2,
  ...attributesVersion3,
  ...attributesVersion4,
  ...attributesVersion5,
  ...attributesVersion6,
  ...attributesVersion7,
  ...attributesVersion8,
  ...attributesVersion9,
  ...attributesVersion10,
  ...attributesVersion11,
  ...attributesVersion12
}

export const createDeviceModel = (sequelize: Sequelize.Sequelize): DeviceModelStatic => sequelize.define('Device', attributes) as DeviceModelStatic
export const hasDeviceManipulation = (device: DeviceAttributes) => {
  const manipulationOfProtectionLevel = device.currentProtectionLevel !== device.highestProtectionLevel
  const manipulationOfUsageStats = device.currentUsageStatsPermission !== device.highestUsageStatsPermission
  const manipulationOfNotificationAccess = device.currentNotificationAccessPermission !== device.highestNotificationAccessPermission
  const manipulationOfAppVersion = device.currentAppVersion !== device.highestAppVersion
  const manipulationOfOverlayPermission = device.currentOverlayPermission !== device.highestOverlayPermission
  const manipulationOfAsPermission = device.asEnabled !== device.wasAsEnabled

  const hasActiveManipulationWarning = manipulationOfProtectionLevel ||
    manipulationOfUsageStats ||
    manipulationOfNotificationAccess ||
    manipulationOfAppVersion ||
    device.triedDisablingDeviceAdmin ||
    device.didReboot ||
    manipulationOfOverlayPermission ||
    manipulationOfAsPermission

  const hasAnyManipulation = hasActiveManipulationWarning || device.hadManipulation ||
    device.manipulationFlags !== 0

  return hasAnyManipulation
}
