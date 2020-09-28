/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2020 Jonas Lochmann
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

import { Unauthorized } from 'http-errors'
import { Database, Transaction } from '../../../database'
import { SourceFamilyNotFoundException } from './exception/illegal-state'

export interface ApplyActionBaseInfo {
  familyId: string
  deviceId: string
  nextSequenceNumber: number
  hasFullVersion: boolean
}

export async function getApplyActionBaseInfo ({ database, transaction, deviceAuthToken }: {
  database: Database
  transaction: Transaction
  deviceAuthToken: string
}): Promise<ApplyActionBaseInfo> {
  const deviceEntryUnsafe = await database.device.findOne({
    where: { deviceAuthToken },
    attributes: ['familyId', 'deviceId', 'nextSequenceNumber'],
    transaction
  })

  if (!deviceEntryUnsafe) {
    throw new Unauthorized()
  }

  const deviceEntry = {
    familyId: deviceEntryUnsafe.familyId,
    deviceId: deviceEntryUnsafe.deviceId,
    nextSequenceNumber: deviceEntryUnsafe.nextSequenceNumber
  }

  const familyEntryUnsafe = await database.family.findOne({
    where: {
      familyId: deviceEntry.familyId
    },
    transaction,
    attributes: ['hasFullVersion']
  })

  if (!familyEntryUnsafe) {
    throw new SourceFamilyNotFoundException()
  }

  const familyEntry = {
    hasFullVersion: familyEntryUnsafe.hasFullVersion
  }

  return {
    familyId: deviceEntry.familyId,
    deviceId: deviceEntry.deviceId,
    nextSequenceNumber: deviceEntry.nextSequenceNumber,
    hasFullVersion: familyEntry.hasFullVersion
  }
}
