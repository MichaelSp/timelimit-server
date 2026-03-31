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

import * as Sequelize from 'sequelize'
import { Database } from '../../../database'
import { types as pingTypes } from '../../../database/ping'
import { ServerPing } from '../../../object/serverdatastatus'
import { FamilyEntry } from './family-entry'

export async function getPings ({
  database, transaction, familyEntry, deviceId
}: {
  database: Database
  transaction: Sequelize.Transaction
  familyEntry: FamilyEntry
  deviceId: string
}): Promise<Array<ServerPing>> {
  const savedData = await database.ping.findAll({
    where: {
      familyId: familyEntry.familyId,
      receiverDeviceId: deviceId,
    },
    attributes: ['senderDeviceId', 'type', 'token'],
    transaction
  })

  return savedData.map((row) => ({
    deviceId: row.senderDeviceId,
    type: convertType(row.type),
    token: row.token
  }))
}

function convertType(type: number): 'ping' | 'pong' {
  if (type === pingTypes.ping) return 'ping'
  else if (type === pingTypes.pong) return 'pong'
  else throw new Error()
}
