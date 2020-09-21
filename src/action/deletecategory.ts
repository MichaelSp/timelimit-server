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

import { assertIdWithinFamily } from '../util/token'
import { ParentAction } from './basetypes'

export class DeleteCategoryAction extends ParentAction {
  readonly categoryId: string

  constructor ({ categoryId }: {categoryId: string}) {
    super()

    assertIdWithinFamily(categoryId)

    this.categoryId = categoryId
  }

  static parse = ({ categoryId }: SerializedDeleteCategoryAction) => (
    new DeleteCategoryAction({ categoryId })
  )
}

export interface SerializedDeleteCategoryAction {
  type: 'DELETE_CATEGORY'
  categoryId: string
}
