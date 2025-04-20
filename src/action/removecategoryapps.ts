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

import { ParentAction } from "./basetypes.js"
import {
  assertIdWithinFamily,
  assertNonEmptyListWithoutDuplicates,
} from "./meta/util.js"

const actionType = "RemoveCategoryAppsAction"

export class RemoveCategoryAppsAction extends ParentAction {
  readonly categoryId: string
  readonly packageNames: Array<string>

  constructor({
    categoryId,
    packageNames,
  }: {
    categoryId: string
    packageNames: Array<string>
  }) {
    super()

    assertIdWithinFamily({
      actionType,
      field: "categoryId",
      value: categoryId,
    })
    assertNonEmptyListWithoutDuplicates({
      actionType,
      field: "packageNames",
      list: packageNames,
    })

    this.categoryId = categoryId
    this.packageNames = packageNames
  }

  static parse = ({
    categoryId,
    packageNames,
  }: SerializedRemoveCategoryAppsAction) =>
    new RemoveCategoryAppsAction({ categoryId, packageNames })
}

export interface SerializedRemoveCategoryAppsAction {
  type: "REMOVE_CATEGORY_APPS"
  categoryId: string
  packageNames: Array<string>
}
