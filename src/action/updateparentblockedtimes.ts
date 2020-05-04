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

import { validateAndParseBitmask } from '../util/bitmask'
import { assertIdWithinFamily } from '../util/token'
import { ParentAction } from './basetypes'

export class UpdateParentBlockedTimesAction extends ParentAction {
  readonly parentId: string
  readonly blockedTimes: string

  constructor ({ parentId, blockedTimes }: {
    parentId: string
    blockedTimes: string
  }) {
    super()

    assertIdWithinFamily(parentId)

    {
      const parsedBlockedTimes = validateAndParseBitmask(blockedTimes, 60 * 24 * 7 /* number of minutes per week */)

      for (let day = 0; day < 7; day++) {
        let blockedMinutes = 0

        for (let minute = 0; minute < 60 * 24 /* 1 day */; minute++) {
          if (parsedBlockedTimes[day * 60 * 24 + minute]) {
            blockedMinutes++
          }
        }

        if (blockedMinutes > 60 * 18 /* 18 hours */) {
          throw new Error('too much blocked minutes per day')
        }
      }
    }

    this.parentId = parentId
    this.blockedTimes = blockedTimes
  }

  serialize = (): SerializedUpdateParentBlockedTimesAction => ({
    type: 'UPDATE_PARENT_BLOCKED_TIMES',
    parentId: this.parentId,
    times: this.blockedTimes
  })

  static parse = ({ parentId, times }: SerializedUpdateParentBlockedTimesAction) => (
    new UpdateParentBlockedTimesAction({
      parentId,
      blockedTimes: times
    })
  )
}

export interface SerializedUpdateParentBlockedTimesAction {
  type: 'UPDATE_PARENT_BLOCKED_TIMES'
  parentId: string
  times: string
}