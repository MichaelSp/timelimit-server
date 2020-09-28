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

import { AppLogicAction } from './basetypes'
import { assertNonEmptyListWithoutDuplicates } from './meta/util'

const actionType = 'RemoveInstalledAppsAction'

export class RemoveInstalledAppsAction extends AppLogicAction {
  readonly packageNames: Array<string>

  constructor ({ packageNames }: {packageNames: Array<string>}) {
    super()

    assertNonEmptyListWithoutDuplicates({ actionType, field: 'packageNames', list: packageNames })

    this.packageNames = packageNames
  }

  static parse = ({ packageNames }: SerializedRemoveInstalledAppsAction) => (
    new RemoveInstalledAppsAction({ packageNames })
  )
}

export interface SerializedRemoveInstalledAppsAction {
  type: 'REMOVE_INSTALLED_APPS'
  packageNames: Array<string>
}
