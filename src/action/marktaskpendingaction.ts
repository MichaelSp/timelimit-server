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

import { AppLogicAction } from "./basetypes.js"
import { assertIdWithinFamily } from "./meta/util.js"

const actionType = "MarkTaskPendingAction"

export class MarkTaskPendingAction extends AppLogicAction {
  readonly taskId: string

  constructor({ taskId }: { taskId: string }) {
    super()

    assertIdWithinFamily({ actionType, field: "taskId", value: taskId })

    this.taskId = taskId
  }

  static parse = ({ taskId }: SerializedMarkTaskPendingAction) =>
    new MarkTaskPendingAction({ taskId })
}

export interface SerializedMarkTaskPendingAction {
  type: "MARK_TASK_PENDING"
  taskId: string
}
