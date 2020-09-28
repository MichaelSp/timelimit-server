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

import { assertParentPasswordValid, ParentPassword, ParentPasswordValidationException } from '../api/schema'
import { ParentAction } from './basetypes'
import { InvalidActionParameterException } from './meta/exception'
import { assertIdWithinFamily } from './meta/util'

const actionType = 'SetChildPasswordAction'

export class SetChildPasswordAction extends ParentAction {
  readonly childUserId: string
  readonly newPassword: ParentPassword

  constructor ({ childUserId, newPassword }: {
    childUserId: string
    newPassword: ParentPassword
  }) {
    super()

    assertIdWithinFamily({ actionType, field: 'childUserId', value: childUserId })

    try {
      assertParentPasswordValid(newPassword)
    } catch (ex) {
      if (ex instanceof ParentPasswordValidationException) {
        throw new InvalidActionParameterException({
          actionType,
          staticMessage: 'invalid parent password'
        })
      } else throw ex
    }

    this.childUserId = childUserId
    this.newPassword = newPassword
  }

  static parse = ({ childId, newPassword }: SerializedSetChildPasswordAction) => (
    new SetChildPasswordAction({
      childUserId: childId,
      newPassword
    })
  )
}

export interface SerializedSetChildPasswordAction {
  type: 'SET_CHILD_PASSWORD'
  childId: string
  newPassword: ParentPassword
}
