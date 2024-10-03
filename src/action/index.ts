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

export { AppLogicAction, ChildAction, ParentAction } from "./basetypes"

export { AddCategoryAppsAction } from "./addcategoryapps"
export { AddCategoryNetworkIdAction } from "./addcategorynetworkid"
export { AddUserAction } from "./adduser"
export { AddInstalledAppsAction } from "./addinstalledapps"
export { AddParentU2fKeyAction } from "./addu2fkey"
export { AddUsedTimeAction } from "./addusedtime"
export { AddUsedTimeActionVersion2 } from "./addusedtime2"
export { ChangeParentPasswordAction } from "./changeparentpassword"
export { ChildChangePasswordAction } from "./childchangepassword"
export { ChildSignInAction } from "./childsignin"
export { CreateCategoryAction } from "./createcategory"
export { CreateTimeLimitRuleAction } from "./createtimelimitrule"
export { DeleteCategoryAction } from "./deletecategory"
export { DeleteTimeLimitRuleAction } from "./deletetimelimitrule"
export { FinishKeyRequestAction } from "./finishkeyrequest"
export { ForceSyncAction } from "./forcesync"
export { IgnoreManipulationAction } from "./ignoremanipulation"
export { IncrementCategoryExtraTimeAction } from "./incrementcategoryextratime"
export { RemoveCategoryAppsAction } from "./removecategoryapps"
export { RemoveInstalledAppsAction } from "./removeinstalledapps"
export { RemoveParentU2fKeyAction } from "./removeu2fkey"
export { RemoveUserAction } from "./removeuser"
export { ResetCategoryNetworkIdsAction } from "./resetcategorynetworkids"
export { RenameChildAction } from "./renamechild"
export { ReplyToKeyRequestAction } from "./replytokeyrequest"
export { ReportU2fLoginAction } from "./reportu2flogin"
export { SetCategoryExtraTimeAction } from "./setcategoryextratime"
export { SetCategoryForUnassignedAppsAction } from "./setcategoryforunassignedapps"
export { SetChildPasswordAction } from "./setchildpassword"
export { SetConsiderRebootManipulationAction } from "./setconsiderrebootmanipulation"
export { SetDeviceDefaultUserAction } from "./setdevicedefaultuser"
export { SetDeviceDefaultUserTimeoutAction } from "./setdevicedefaultusertimeout"
export { SetDeviceUserAction } from "./setdeviceuser"
export { SetKeepSignedInAction } from "./setkeepsignedin"
export { SetParentCategoryAction } from "./setparentcategory"
export { SetRelaxPrimaryDeviceAction } from "./setrelaxprimarydevice"
export { SetSendDeviceConnected } from "./setsenddeviceconnected"
export { SetUserDisableLimitsUntilAction } from "./setuserdisablelimitsuntil"
export { SetUserTimezoneAction } from "./setusertimezone"
export { SignOutAtDeviceAction } from "./signoutatdevice"
export { TriedDisablingDeviceAdminAction } from "./trieddisablingdeviceadmin"
export { UpdateAppActivitiesAction } from "./updateappactivities"
export { UpdateCategoryBatteryLimitAction } from "./updatecategorybatterylimit"
export { UpdateCategoryBlockAllNotificationsAction } from "./updatecategoryblockallnotifications"
export { UpdateCategoryBlockedTimesAction } from "./updatecategoryblockedtimes"
export { UpdateCategoryDisableLimitsAction } from "./updatecategorydisablelimits"
export { UpdateCategoryFlagsAction } from "./updatecategoryflags"
export { UpdateCategorySortingAction } from "./updatecategorysorting"
export { UpdateCategoryTemporarilyBlockedAction } from "./updatecategorytemporarilyblocked"
export { UpdateCategoryTimeWarningsAction } from "./updatecategorytimewarnings"
export { UpdateCategoryTitleAction } from "./updatecategorytitle"
export { UpdateDeviceNameAction } from "./updatedevicename"
export { UpdateDeviceStatusAction } from "./updatedevicestatus"
export { UpdateEnableActivityLevelBlockingAction } from "./updateenableactivitylevelblocking"
export { UpdateInstalledAppsAction } from "./updateinstalledapps"
export { UpdateNetworkTimeVerificationAction } from "./updatenetworktimeverification"
export { UpdateParentNotificationFlagsAction } from "./updateparentnotificationflags"
export { UpdateTimelimitRuleAction } from "./updatetimelimitrule"
export { UpdateUserFlagsAction } from "./updateuserflags"
export { UpdateUserLimitLoginCategory } from "./updateuserlimitlogincategory"
export { MarkTaskPendingAction } from "./marktaskpendingaction"
export { DeleteChildTaskAction } from "./deletechildtaskaction"
export { UpdateChildTaskAction } from "./updatechildtaskaction"
export { ReviewChildTaskAction } from "./reviewchildtaskaction"
export { UpdateUserLimitLoginPreBlockDuration } from "./updateuserlimitloginpreblockduration"
export { UploadDevicePublicKeyAction } from "./uploaddevicepublickey"
export { SendKeyRequestAction } from "./sendkeyrequest"
