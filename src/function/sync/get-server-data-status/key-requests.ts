/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2022 Jonas Lochmann
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

import * as Sequelize from "sequelize"
import { Database } from "../../../database"
import { ServerKeyRequest } from "../../../object/serverdatastatus"
import { FamilyEntry } from "./family-entry"

export async function getKeyRequests({
  database,
  transaction,
  familyEntry,
  lastSeenRequestIndex,
  deviceId,
}: {
  database: Database
  transaction: Sequelize.Transaction
  familyEntry: FamilyEntry
  lastSeenRequestIndex: number | null
  deviceId: string
}): Promise<Array<ServerKeyRequest> | null> {
  const data = await database.keyRequest.findAll({
    where: {
      familyId: familyEntry.familyId,
      senderDeviceId: {
        [Sequelize.Op.ne]: deviceId,
      },
      ...(lastSeenRequestIndex === null
        ? {}
        : {
            serverSequenceNumber: {
              [Sequelize.Op.gt]: lastSeenRequestIndex,
            },
          }),
    },
    transaction,
    limit: 32,
  })

  if (data.length === 0) return null

  return data.map((item) => ({
    srvSeq: parseInt(item.serverSequenceNumber),
    senId: item.senderDeviceId,
    senSeq: parseInt(item.senderSequenceNumber),
    deviceId: item.deviceId || undefined,
    categoryId: item.categoryId || undefined,
    type: item.type,
    tempKey: item.tempKey.toString("base64"),
    signature: item.signature.toString("base64"),
  }))
}
