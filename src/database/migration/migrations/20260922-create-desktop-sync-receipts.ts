/*
 * server component for the TimeLimit App
 * Copyright (C) 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 */

import { Sequelize, Transaction } from 'sequelize'

export async function up (sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    const dialect = sequelize.getDialect()
    const isMysql = dialect === 'mysql' || dialect === 'mariadb'
    const quote = isMysql ? '`' : '"'
    const bigint = dialect === 'sqlite' ? 'LONG' : 'BIGINT'

    await sequelize.query(
      `CREATE TABLE ${quote}DesktopSyncReceipts${quote} (` +
      `${quote}familyId${quote} VARCHAR(10) NOT NULL, ` +
      `${quote}deviceId${quote} VARCHAR(6) NOT NULL, ` +
      `${quote}checkpointId${quote} VARCHAR(128) NOT NULL, ` +
      `${quote}payloadSha256${quote} VARCHAR(64) NOT NULL, ` +
      `${quote}acceptedThrough${quote} ${bigint} NOT NULL, ` +
      `${quote}shouldDoFullSync${quote} BOOLEAN NOT NULL, ` +
      `PRIMARY KEY (${quote}familyId${quote}, ${quote}deviceId${quote}, ${quote}checkpointId${quote}), ` +
      `FOREIGN KEY (${quote}familyId${quote}, ${quote}deviceId${quote}) REFERENCES ${quote}Devices${quote} (${quote}familyId${quote}, ${quote}deviceId${quote}) ON UPDATE CASCADE ON DELETE CASCADE` +
      ')',
      { transaction },
    )
  })
}

export async function down (sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    await sequelize.getQueryInterface().dropTable('DesktopSyncReceipts', { transaction })
  })
}
