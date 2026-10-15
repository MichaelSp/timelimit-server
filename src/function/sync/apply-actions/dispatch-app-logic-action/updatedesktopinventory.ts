/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UpdateDesktopInventoryAction } from '../../../../action/index.js'
import { types } from '../../../../database/encryptedapplist.js'
import { ApplyActionException } from '../exception/index.js'
import { generateVersionId } from '../../../../util/token.js'
import { Cache } from '../cache.js'

export async function dispatchUpdateDesktopInventory({
  deviceId,
  action,
  cache,
}: {
  deviceId: string
  action: UpdateDesktopInventoryAction
  cache: Cache
}) {
  const device = await cache.transaction.legacy.database.device.findOne({
    where: { familyId: cache.familyId, deviceId },
    attributes: ['platformType', 'platformLevel'],
    transaction: cache.transaction.legacy.transaction,
  })

  // The platform fields are the persisted capability for push-actions. A
  // desktop client first reports platformType=desktop and platformLevel>=1
  // through UPDATE_DEVICE_STATUS; Android devices cannot enter this lane.
  if (!device || device.platformType !== 'desktop' || device.platformLevel < 1) {
    throw new ApplyActionException({
      staticMessage: 'desktop inventory requires desktopSync capability',
    })
  }

  await cache.transaction.legacy.database.encryptedAppList.upsert({
    familyId: cache.familyId,
    deviceId,
    type: types.desktopInventory,
    version: generateVersionId(),
    data: action.ciphertext,
  }, { transaction: cache.transaction.legacy.transaction })

  cache.incrementTriggeredSyncLevel(1)
}
