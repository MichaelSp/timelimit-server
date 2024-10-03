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
  SerializedAddInstalledAppsAction,
} from "../addinstalledapps"
import { AddUsedTimeAction, SerializedAddUsedTimeAction } from "../addusedtime"
import {
  AddUsedTimeActionVersion2,
  SerializedAddUsedTimeActionVersion2,
} from "../addusedtime2"
import { AppLogicAction } from "../basetypes"
import {
  FinishKeyRequestAction,
  SerializedFinishKeyRequestAction,
} from "../finishkeyrequest"
import { ForceSyncAction, SerializedForceSyncAction } from "../forcesync"
import {
  MarkTaskPendingAction,
  SerializedMarkTaskPendingAction,
} from "../marktaskpendingaction"
import { UnknownActionTypeException } from "../meta/exception"
import {
  RemoveInstalledAppsAction,
  SerializedRemoveInstalledAppsAction,
} from "../removeinstalledapps"
import {
  ReplyToKeyRequestAction,
  SerializedReplyToKeyRequestAction,
} from "../replytokeyrequest"
import {
  SendKeyRequestAction,
  SerializedSendKeyRequestAction,
} from "../sendkeyrequest"
import {
  SerializedSignOutAtDeviceAction,
  SignOutAtDeviceAction,
} from "../signoutatdevice"
import {
  SerialiezdTriedDisablingDeviceAdminAction,
  TriedDisablingDeviceAdminAction,
} from "../trieddisablingdeviceadmin"
import {
  SerializedUpdateAppActivitiesAction,
  UpdateAppActivitiesAction,
} from "../updateappactivities"
import {
  SerializedUpdateDeviceStatusAction,
  UpdateDeviceStatusAction,
} from "../updatedevicestatus"
import {
  SerializedUpdateInstalledAppsAction,
  UpdateInstalledAppsAction,
} from "../updateinstalledapps"
import {
  SerializedUploadDevicePublicKeyAction,
  UploadDevicePublicKeyAction,
} from "../uploaddevicepublickey"

export type SerializedAppLogicAction =
  | SerializedAddInstalledAppsAction
  | SerializedAddUsedTimeAction
  | SerializedAddUsedTimeActionVersion2
  | SerializedFinishKeyRequestAction
  | SerializedForceSyncAction
  | SerializedReplyToKeyRequestAction
  | SerializedMarkTaskPendingAction
  | SerializedUpdateInstalledAppsAction
  | SerializedRemoveInstalledAppsAction
  | SerializedSendKeyRequestAction
  | SerializedSignOutAtDeviceAction
  | SerialiezdTriedDisablingDeviceAdminAction
  | SerializedUpdateAppActivitiesAction
  | SerializedUpdateDeviceStatusAction
  | SerializedUploadDevicePublicKeyAction

export const parseAppLogicAction = (
  serialized: SerializedAppLogicAction,
): AppLogicAction => {
  if (serialized.type === "ADD_USED_TIME") {
    return AddUsedTimeAction.parse(serialized)
  } else if (serialized.type === "ADD_USED_TIME_V2") {
    return AddUsedTimeActionVersion2.parse(serialized)
  } else if (serialized.type === "ADD_INSTALLED_APPS") {
    return AddInstalledAppsAction.parse(serialized)
  } else if (serialized.type === "FINISH_KEY_REQUEST") {
    return FinishKeyRequestAction.parse(serialized)
  } else if (serialized.type === "FORCE_SYNC") {
    return ForceSyncAction.instance
  } else if (serialized.type === "REPLY_TO_KEY_REQUEST") {
    return ReplyToKeyRequestAction.parse(serialized)
  } else if (serialized.type === "MARK_TASK_PENDING") {
    return MarkTaskPendingAction.parse(serialized)
  } else if (serialized.type === "UPDATE_INSTALLED_APPS") {
    return UpdateInstalledAppsAction.parse(serialized)
  } else if (serialized.type === "REMOVE_INSTALLED_APPS") {
    return RemoveInstalledAppsAction.parse(serialized)
  } else if (serialized.type === "SEND_KEY_REQUEST") {
    return SendKeyRequestAction.parse(serialized)
  } else if (serialized.type === "SIGN_OUT_AT_DEVICE") {
    return SignOutAtDeviceAction.instance
  } else if (serialized.type === "TRIED_DISABLING_DEVICE_ADMIN") {
    return new TriedDisablingDeviceAdminAction()
  } else if (serialized.type === "UPDATE_APP_ACTIVITIES") {
    return UpdateAppActivitiesAction.parse(serialized)
  } else if (serialized.type === "UPDATE_DEVICE_STATUS") {
    return UpdateDeviceStatusAction.parse(serialized)
  } else if (serialized.type === "UPLOAD_DEVICE_PUBLIC_KEY") {
    return UploadDevicePublicKeyAction.parse(serialized)
  } else {
    throw new UnknownActionTypeException({ group: "app logic" })
  }
}
