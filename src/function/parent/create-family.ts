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

import { Conflict } from "http-errors"
import {
  NewDeviceInfo,
  PlaintextParentPassword,
  assertPlaintextParentPasswordValid,
} from "../../api/schema"
import { Database } from "../../database"
import { maxMailNotificationFlags } from "../../database/user"
import { EventHandler } from "../../monitoring/eventhandler"
import { createEmptyClientDataStatus } from "../../object/clientdatastatus"
import { ServerDataStatus } from "../../object/serverdatastatus"
import {
  generateAuthToken,
  generateFamilyId,
  generateIdWithinFamily,
  generateVersionId,
} from "../../util/token"
import { requireMailAndLocaleByAuthToken } from "../authentication"
import { prepareDeviceEntry } from "../device/prepare-device-entry"
import { generateServerDataStatus } from "../sync/get-server-data-status"

export async function createFamily({
  database,
  eventHandler,
  mailAuthToken,
  firstParentDevice,
  password,
  timeZone,
  parentName,
  deviceName,
  clientLevel,
}: {
  database: Database
  eventHandler: EventHandler
  mailAuthToken: string
  firstParentDevice: NewDeviceInfo
  password: PlaintextParentPassword
  timeZone: string
  parentName: string
  deviceName: string
  clientLevel: number | null
  // no transaction here because this is directly called from an API endpoint
}): Promise<{
  deviceAuthToken: string
  deviceId: string
  data: ServerDataStatus
}> {
  assertPlaintextParentPasswordValid(password)

  return database.transaction(async (transaction) => {
    const now = Date.now().toString(10)
    const mailInfo = await requireMailAndLocaleByAuthToken({
      database,
      mailAuthToken,
      transaction,
      invalidate: true,
    })

    // ensure that no family was created for this mail yet
    const existingUserEntry = await database.user.findOne({
      where: {
        mail: mailInfo.mail,
      },
      transaction,
    })

    if (existingUserEntry) {
      throw new Conflict()
    }

    const familyId = generateFamilyId()
    const userId = generateIdWithinFamily()
    const deviceId = generateIdWithinFamily()
    const deviceAuthToken = generateAuthToken()

    // create family
    await database.family.create(
      {
        familyId,
        name: "",
        createdAt: now,
        userListVersion: generateVersionId(),
        deviceListVersion: generateVersionId(),
        // 14 days demo version
        fullVersionUntil: (Date.now() + 1000 * 60 * 60 * 24 * 14).toString(10),
        hasFullVersion: true,
        nextServerKeyRequestSeq: "1",
        u2fKeysVersion: generateVersionId(),
      },
      { transaction },
    )

    // create parent user
    await database.user.create(
      {
        familyId,
        userId,
        name: parentName,
        passwordHash: password.hash,
        secondPasswordHash: password.secondHash,
        secondPasswordSalt: password.secondSalt,
        type: "parent",
        mail: mailInfo.mail,
        timeZone,
        disableTimelimitsUntil: "0",
        currentDevice: "",
        categoryForNotAssignedApps: "",
        relaxPrimaryDeviceRule: false,
        mailNotificationFlags: maxMailNotificationFlags,
        blockedTimes: "",
        flags: "0",
      },
      { transaction },
    )

    // add parent device
    await database.device.create(
      prepareDeviceEntry({
        familyId,
        deviceId,
        deviceName,
        newDeviceInfo: firstParentDevice,
        userId,
        deviceAuthToken,
        isUserKeptSignedIn: true,
      }),
      { transaction },
    )

    const data = await generateServerDataStatus({
      database,
      clientStatus: createEmptyClientDataStatus({ clientLevel }),
      familyId,
      deviceId,
      transaction,
      eventHandler,
    })

    return {
      deviceAuthToken,
      deviceId,
      data,
    }
  })
}
