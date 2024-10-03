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

import {
  ChildAction,
  ChildChangePasswordAction,
  ChildSignInAction,
} from "../../../../action"
import { Cache } from "../cache"
import { ActionObjectTypeNotHandledException } from "../exception/illegal-state"
import { dispatchChildChangePassword } from "./childchangepassword"
import { dispatchChildSignIn } from "./childsignin"

export const dispatchChildAction = async ({
  action,
  deviceId,
  childUserId,
  cache,
}: {
  action: ChildAction
  deviceId: string
  childUserId: string
  cache: Cache
}) => {
  if (action instanceof ChildChangePasswordAction) {
    await dispatchChildChangePassword({ action, childUserId, cache })
  } else if (action instanceof ChildSignInAction) {
    await dispatchChildSignIn({ action, childUserId, deviceId, cache })
  } else {
    throw new ActionObjectTypeNotHandledException()
  }
}
