import { Sequelize, Transaction } from 'sequelize'

export async function up(sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    const dialect = sequelize.getDialect()
    const q = dialect === 'mysql' || dialect === 'mariadb' ? '`' : '"'
    const id = dialect === 'sqlite'
      ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
      : dialect === 'postgres'
        ? 'BIGSERIAL PRIMARY KEY'
        : 'BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY'

    await sequelize.query(
      `CREATE TABLE ${q}CategoryAppAuditLogs${q} (` +
      `${q}id${q} ${id}, ` +
      `${q}familyId${q} VARCHAR(10) NOT NULL, ` +
      `${q}occurredAt${q} BIGINT NOT NULL, ` +
      `${q}actorType${q} VARCHAR(32) NOT NULL, ` +
      `${q}actorUserId${q} VARCHAR(6) NOT NULL, ` +
      `${q}actorName${q} VARCHAR(255) NOT NULL, ` +
      `${q}sourceDeviceId${q} VARCHAR(6) NOT NULL, ` +
      `${q}childId${q} VARCHAR(6) NOT NULL, ` +
      `${q}childName${q} VARCHAR(255) NOT NULL, ` +
      `${q}packageName${q} VARCHAR(255) NOT NULL, ` +
      `${q}fromCategoryId${q} VARCHAR(6) NOT NULL, ` +
      `${q}fromCategoryTitle${q} VARCHAR(255) NOT NULL, ` +
      `${q}toCategoryId${q} VARCHAR(6) NOT NULL, ` +
      `${q}toCategoryTitle${q} VARCHAR(255) NOT NULL, ` +
      `FOREIGN KEY (${q}familyId${q}) REFERENCES ${q}Families${q} (${q}familyId${q}) ON UPDATE CASCADE ON DELETE CASCADE` +
      ')',
      { transaction },
    )
    await sequelize.query(
      `CREATE INDEX ${q}CategoryAppAuditLogs_familyId_occurredAt${q} ON ${q}CategoryAppAuditLogs${q} (${q}familyId${q}, ${q}occurredAt${q})`,
      { transaction },
    )
  })
}

export async function down(sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    await sequelize.getQueryInterface().dropTable('CategoryAppAuditLogs', { transaction })
  })
}
