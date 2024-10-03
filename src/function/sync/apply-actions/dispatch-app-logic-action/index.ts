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

import {
    AddInstalledAppsAction,
    AddUsedTimeAction,
    AddUsedTimeActionVersion2,
    AppLogicAction,
    FinishKeyRequestAction,
    ForceSyncAction,
    MarkTaskPendingAction,
    RemoveInstalledAppsAction,
    ReplyToKeyRequestAction,
    SendKeyRequestAction,
    SignOutAtDeviceAction,
    TriedDisablingDeviceAdminAction,
    UpdateAppActivitiesAction,
    UpdateDeviceStatusAction,
    UpdateInstalledAppsAction,
    UploadDevicePublicKeyAction
} from '../../../../action'
import { EventHandler } from '../../../../monitoring/eventhandler'
import { Cache } from '../cache'
import { ActionObjectTypeNotHandledException } from '../exception/illegal-state'
import { dispatchAddUsedTime } from './addusedtime'
import { dispatchAddUsedTimeVersion2 } from './addusedtime2'
import { dispatchFinishKeyRequestAction } from './finishkeyrequest'
import { dispatchForceSyncAction } from './forcesync'
import { dispatchMarkTaskPendingAction } from './marktaskpendingaction'
import { dispatchReplyToKeyRequestAction } from './replytokeyrequest'
import { dispatchSendKeyRequestAction } from './sendkeyrequest'
import { dispatchSignOutAtDevice } from './signoutatdevice'
import { dispatchTriedDisablingDeviceAdmin } from './trieddisablingdeviceadmin'
import { dispatchUpdateDeviceStatus } from './updatedevicestatus'
import { dispatchUpdateInstalledApps } from './updateinstalledapps'
import { dispatchUploadDevicePublicKeyAction } from './uploaddevicepublickey'

export const dispatchAppLogicAction = async ({ action, deviceId, cache, eventHandler }: {
  action: AppLogicAction
  deviceId: string
  cache: Cache
  eventHandler: EventHandler
}) => {
  if (action instanceof AddInstalledAppsAction) {
    // do nothing
  } else if (action instanceof AddUsedTimeAction) {
    await dispatchAddUsedTime({ deviceId, action, cache })
  } else if (action instanceof AddUsedTimeActionVersion2) {
    await dispatchAddUsedTimeVersion2({ deviceId, action, cache, eventHandler })
  } else if (action instanceof FinishKeyRequestAction) {
    await dispatchFinishKeyRequestAction({ deviceId, action, cache })
  } else if (action instanceof ForceSyncAction) {
    await dispatchForceSyncAction({ deviceId, action, cache })
  } else if (action instanceof MarkTaskPendingAction) {
    await dispatchMarkTaskPendingAction({ deviceId, action, cache })
  } else if (action instanceof ReplyToKeyRequestAction) {
    await dispatchReplyToKeyRequestAction({ deviceId, action, cache, eventHandler })
  } else if (action instanceof RemoveInstalledAppsAction) {
    // do nothing
  } else if (action instanceof SendKeyRequestAction) {
    await dispatchSendKeyRequestAction({ deviceId, action, cache })
  } else if (action instanceof SignOutAtDeviceAction) {
    await dispatchSignOutAtDevice({ deviceId, action, cache })
  } else if (action instanceof UpdateDeviceStatusAction) {
    await dispatchUpdateDeviceStatus({ deviceId, action, cache })
  } else if (action instanceof UpdateAppActivitiesAction) {
    // do nothing
  } else if (action instanceof TriedDisablingDeviceAdminAction) {
    await dispatchTriedDisablingDeviceAdmin({ deviceId, action, cache })
  } else if (action instanceof UpdateInstalledAppsAction) {
    await dispatchUpdateInstalledApps({ deviceId, action, cache })
  } else if (action instanceof UploadDevicePublicKeyAction) {
    await dispatchUploadDevicePublicKeyAction({ deviceId, action, cache, eventHandler })
  } else {
    throw new ActionObjectTypeNotHandledException()
  }
}
