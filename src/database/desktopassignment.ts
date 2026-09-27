import * as Sequelize from 'sequelize'
import { familyIdColumn, idWithinFamilyColumn } from './columns.js'
import { SequelizeAttributes } from './types.js'

// Canonical ASCII, lower-case reverse-DNS identity; never a path or package name.
export function isDesktopBundleId(value: string): boolean {
  return value.length <= 255 && value.includes('.') && value.split('.').every(
    (part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(part),
  )
}

export interface DesktopAssignmentAttributes {
  familyId: string
  deviceId: string
  categoryId: string
  platform: 'macos'
  bundleId: string
}

export type DesktopAssignmentModel = Sequelize.Model<DesktopAssignmentAttributes> & DesktopAssignmentAttributes
export type DesktopAssignmentModelStatic = typeof Sequelize.Model & {
  new (values?: object, options?: Sequelize.BuildOptions): DesktopAssignmentModel
}

export const attributes: SequelizeAttributes<DesktopAssignmentAttributes> = {
  familyId: { ...familyIdColumn, primaryKey: true },
  deviceId: { ...idWithinFamilyColumn, primaryKey: true },
  categoryId: { ...idWithinFamilyColumn },
  platform: { type: Sequelize.STRING(5), allowNull: false, primaryKey: true, validate: { isIn: [['macos']] } },
  bundleId: {
    type: Sequelize.STRING(255), allowNull: false, primaryKey: true,
    validate: { canonical(value: string) { if (!isDesktopBundleId(value)) throw new Error('invalid desktop bundle identity') } },
  },
}

export const createDesktopAssignmentModel = (sequelize: Sequelize.Sequelize): DesktopAssignmentModelStatic =>
  sequelize.define('DesktopAssignment', attributes) as DesktopAssignmentModelStatic
