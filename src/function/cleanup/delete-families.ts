/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
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

import { difference } from 'lodash'
import * as Sequelize from 'sequelize'
import { SimpleDatabaseTransaction } from '../../database/simple'

export async function deleteFamilies ({ transaction, familiyIds }: {
  transaction: SimpleDatabaseTransaction
  familiyIds: Array<string>
}) {
  if (familiyIds.length === 0) {
    return
  }

  // category
  await transaction.legacy.database.category.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // categoryapp
  await transaction.legacy.database.categoryApp.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // purchase
  await transaction.legacy.database.purchase.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // timelimitrule
  await transaction.legacy.database.timelimitRule.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // usedtime
  await transaction.legacy.database.usedTime.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // session durations
  await transaction.legacy.database.sessionDuration.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // user
  await transaction.legacy.database.user.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // device
  const oldDeviceAuthTokens = (await transaction.legacy.database.device.findAll({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds
      }
    },
    attributes: ['deviceAuthToken'],
    transaction: transaction.legacy.transaction
  })).map((item) => item.deviceAuthToken)

  await transaction.legacy.database.device.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })

  // olddevice
  if (oldDeviceAuthTokens.length > 0) {
    const knownOldDeviceAuthTokens = (await transaction.legacy.database.oldDevice.findAll({
      where: {
        deviceAuthToken: {
          [Sequelize.Op.in]: oldDeviceAuthTokens
        }
      },
      transaction: transaction.legacy.transaction
    })).map((item) => item.deviceAuthToken)

    const oldDeviceAuthTokensToAdd = difference(
      oldDeviceAuthTokens,
      knownOldDeviceAuthTokens,
    )

    if (oldDeviceAuthTokensToAdd.length > 0) {
      await transaction.legacy.database.oldDevice.bulkCreate(
        oldDeviceAuthTokensToAdd.map((item) => ({
          deviceAuthToken: item,
        })),
        { transaction: transaction.legacy.transaction }
      )
    }
  }

  // family
  await transaction.legacy.database.family.destroy({
    where: {
      familyId: {
        [Sequelize.Op.in]: familiyIds,
      },
    },
    transaction: transaction.legacy.transaction
  })
}
