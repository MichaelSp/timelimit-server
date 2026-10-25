/*
 * server component for the TimeLimit App
 * Copyright (C) 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 */

import * as Sequelize from 'sequelize'
import { familyIdColumn, idWithinFamilyColumn } from './columns.js'
import { SequelizeAttributes } from './types.js'

export interface DesktopSyncReceiptAttributes {
  familyId: string
  deviceId: string
  checkpointId: string
  payloadSha256: string
  acceptedThrough: number
  shouldDoFullSync: boolean
}

export type DesktopSyncReceiptModel = Sequelize.Model<DesktopSyncReceiptAttributes> & DesktopSyncReceiptAttributes
export type DesktopSyncReceiptModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): DesktopSyncReceiptModel
}

export const attributes: SequelizeAttributes<DesktopSyncReceiptAttributes> = {
  familyId: { ...familyIdColumn, primaryKey: true },
  deviceId: { ...idWithinFamilyColumn, primaryKey: true },
  checkpointId: {
    type: Sequelize.STRING(128),
    allowNull: false,
    primaryKey: true,
    validate: { is: /^[\x21-\x7E]{1,128}$/ },
  },
  payloadSha256: {
    type: Sequelize.STRING(64),
    allowNull: false,
    validate: { is: /^[0-9a-f]{64}$/ },
  },
  acceptedThrough: { type: Sequelize.BIGINT, allowNull: false },
  shouldDoFullSync: { type: Sequelize.BOOLEAN, allowNull: false },
}

export const createDesktopSyncReceiptModel = (sequelize: Sequelize.Sequelize): DesktopSyncReceiptModelStatic =>
  sequelize.define('DesktopSyncReceipt', attributes) as DesktopSyncReceiptModelStatic
