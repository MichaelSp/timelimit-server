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
import { ChildAction } from './basetypes'
import { InvalidActionParameterException } from './meta/exception'

const actionType = 'ChildChangePasswordAction'

export class ChildChangePasswordAction extends ChildAction {
  readonly password: ParentPassword

  constructor ({ password }: {
    password: ParentPassword
  }) {
    super()

    try {
      assertParentPasswordValid(password)
    } catch (ex) {
      if (ex instanceof ParentPasswordValidationException) {
        throw new InvalidActionParameterException({
          actionType,
          staticMessage: 'invalid password'
        })
      } else throw ex
    }

    this.password = password
  }

  static parse = ({ password }: SerializedChildChangePasswordAction) => (
    new ChildChangePasswordAction({ password })
  )
}

export interface SerializedChildChangePasswordAction {
  type: 'CHILD_CHANGE_PASSWORD'
  password: ParentPassword
}
