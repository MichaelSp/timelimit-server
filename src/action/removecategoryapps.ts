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

import { assertNonEmptyListWithoutDuplicates } from '../util/list'
import { assertIdWithinFamily } from '../util/token'
import { ParentAction } from './basetypes'

export class RemoveCategoryAppsAction extends ParentAction {
  readonly categoryId: string
  readonly packageNames: Array<string>

  constructor ({ categoryId, packageNames }: {categoryId: string, packageNames: Array<string>}) {
    super()

    assertIdWithinFamily(categoryId)
    assertNonEmptyListWithoutDuplicates(packageNames)

    this.categoryId = categoryId
    this.packageNames = packageNames
  }

  serialize = (): SerializedRemoveCategoryAppsAction => ({
    type: 'REMOVE_CATEGORY_APPS',
    categoryId: this.categoryId,
    packageNames: this.packageNames
  })

  static parse = ({ categoryId, packageNames }: SerializedRemoveCategoryAppsAction) => (
    new RemoveCategoryAppsAction({ categoryId, packageNames })
  )
}

export interface SerializedRemoveCategoryAppsAction {
  type: 'REMOVE_CATEGORY_APPS'
  categoryId: string
  packageNames: Array<string>
}
