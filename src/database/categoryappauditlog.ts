/*
 * server component for the TimeLimit App
 * Copyright (C) 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 */

import * as Sequelize from 'sequelize'
import { familyIdColumn, idWithinFamilyColumn, optionalIdWithinFamilyColumn } from './columns.js'
import { SequelizeAttributes } from './types.js'

export interface CategoryAppAuditLogAttributes {
  id?: number
  familyId: string
  occurredAt: string
  actorType: 'parent' | 'child_self_limit'
  actorUserId: string
  actorName: string
  sourceDeviceId: string
  childId: string
  childName: string
  packageName: string
  fromCategoryId: string
  fromCategoryTitle: string
  toCategoryId: string
  toCategoryTitle: string
}

export type CategoryAppAuditLogModel = Sequelize.Model<CategoryAppAuditLogAttributes> & CategoryAppAuditLogAttributes
export type CategoryAppAuditLogModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): CategoryAppAuditLogModel
}

export const attributes: SequelizeAttributes<CategoryAppAuditLogAttributes> = {
  id: { type: Sequelize.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
  familyId: { ...familyIdColumn },
  occurredAt: { type: Sequelize.BIGINT, allowNull: false },
  actorType: { type: Sequelize.STRING(32), allowNull: false },
  actorUserId: { ...idWithinFamilyColumn },
  actorName: { type: Sequelize.STRING, allowNull: false },
  sourceDeviceId: { ...optionalIdWithinFamilyColumn },
  childId: { ...idWithinFamilyColumn },
  childName: { type: Sequelize.STRING, allowNull: false },
  packageName: { type: Sequelize.STRING, allowNull: false },
  fromCategoryId: { ...optionalIdWithinFamilyColumn },
  fromCategoryTitle: { type: Sequelize.STRING, allowNull: false },
  toCategoryId: { ...optionalIdWithinFamilyColumn },
  toCategoryTitle: { type: Sequelize.STRING, allowNull: false },
}

export const createCategoryAppAuditLogModel = (sequelize: Sequelize.Sequelize): CategoryAppAuditLogModelStatic =>
  sequelize.define('CategoryAppAuditLog', attributes, { indexes: [{ fields: ['familyId', 'occurredAt'] }] }) as CategoryAppAuditLogModelStatic
