/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transaction } from 'sequelize'
import { Migration } from '../../main.js'

// The original table had no database CHECK constraint. Add the widened
// 1..3 constraint where the dialect supports ALTER TABLE constraints; SQLite
// keeps its permissive original table safely (the Sequelize validator remains
// authoritative there and avoids a table-rebuild/data-copy migration).
const constraintName = 'EncryptedAppLists_type_check'

export const up: Migration = async ({ context }) => {
  context.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction: Transaction) => {
    const dialect = context.getDialect()

    if (dialect === 'postgres') {
      await context.query(`ALTER TABLE "EncryptedAppLists" DROP CONSTRAINT IF EXISTS "${constraintName}"`, { transaction })
      await context.query(`ALTER TABLE "EncryptedAppLists" ADD CONSTRAINT "${constraintName}" CHECK ("type" BETWEEN 1 AND 3)`, { transaction })
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // Older MySQL releases parse CHECK but do not enforce it; this is still
      // safe and newer MySQL/MariaDB enforce the same range as PostgreSQL.
      await context.query(`ALTER TABLE \`EncryptedAppLists\` DROP CHECK \`${constraintName}\``, { transaction }).catch(() => {})
      await context.query(`ALTER TABLE \`EncryptedAppLists\` ADD CONSTRAINT \`${constraintName}\` CHECK (\`type\` BETWEEN 1 AND 3)`, { transaction })
    }
  })
}

export const down: Migration = async ({ context }) => {
  context.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction: Transaction) => {
    const dialect = context.getDialect()

    if (dialect === 'postgres') {
      await context.query(`ALTER TABLE "EncryptedAppLists" DROP CONSTRAINT IF EXISTS "${constraintName}"`, { transaction })
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      await context.query(`ALTER TABLE \`EncryptedAppLists\` DROP CHECK \`${constraintName}\``, { transaction }).catch(() => {})
    }
  })
}
