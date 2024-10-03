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

import { ReportU2fLoginAction } from "../../../../action"
import { Cache } from "../cache"
import { ApplyActionUnacceptableAuthMethodException } from "../exception/auth"
import { AuthenticationMethod } from "../types"

export async function dispatchReportU2fLogin({
  authentication,
}: {
  action: ReportU2fLoginAction
  cache: Cache
  authentication: AuthenticationMethod
}) {
  if (authentication !== "u2f") {
    throw new ApplyActionUnacceptableAuthMethodException()
  }

  // nothing to do; the goal was already reached by the authentication
  // validation that expired the dh key
}
