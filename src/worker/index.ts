/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 Jonas Lochmann
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

import { Database } from "../database/index.js"
import { WebsocketApi } from "../websocket/index.js"
import { initDeleteDeprecatedPurchasesWorker } from "./delete-deprecated-purchases.js"
import { initDeleteOldFamiliesWorker } from "./delete-old-families.js"
import { initDeleteOldTokensWorker } from "./delete-old-tokens.js"
import { initDeleteOldUsedTimesWorker } from "./delete-old-used-times.js"

export function initWorkers({
  database,
  websocket,
}: {
  database: Database
  websocket: WebsocketApi
}) {
  initDeleteDeprecatedPurchasesWorker({ database, websocket })
  initDeleteOldFamiliesWorker({ database })
  initDeleteOldTokensWorker({ database })
  initDeleteOldUsedTimesWorker({ database })
}
