import { Sequelize, Transaction } from 'sequelize'

export async function up (sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    const dialect = sequelize.getDialect()
    const q = dialect === 'mysql' || dialect === 'mariadb' ? '`' : '"'
    await sequelize.query(
      `CREATE TABLE ${q}DesktopAssignments${q} (` +
      `${q}familyId${q} VARCHAR(10) NOT NULL, ` +
      `${q}deviceId${q} VARCHAR(6) NOT NULL, ` +
      `${q}categoryId${q} VARCHAR(6) NOT NULL, ` +
      `${q}platform${q} VARCHAR(5) NOT NULL, ` +
      `${q}bundleId${q} VARCHAR(255) NOT NULL, ` +
      `PRIMARY KEY (${q}familyId${q}, ${q}deviceId${q}, ${q}platform${q}, ${q}bundleId${q}), ` +
      `FOREIGN KEY (${q}familyId${q}, ${q}deviceId${q}) REFERENCES ${q}Devices${q} (${q}familyId${q}, ${q}deviceId${q}) ON UPDATE CASCADE ON DELETE CASCADE, ` +
      `FOREIGN KEY (${q}familyId${q}, ${q}categoryId${q}) REFERENCES ${q}Categories${q} (${q}familyId${q}, ${q}categoryId${q}) ON UPDATE CASCADE ON DELETE CASCADE` +
      ')', { transaction },
    )
  })
}

export async function down (sequelize: Sequelize) {
  await sequelize.transaction({ type: Transaction.TYPES.EXCLUSIVE }, async (transaction) => {
    await sequelize.getQueryInterface().dropTable('DesktopAssignments', { transaction })
  })
}
