/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
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

import { Database as LegacyDatabase, Transaction as LegacyTransaction } from '../main'

export interface SimpleDatabase {
  legacy: LegacyDatabase
  transaction: <T> (
    inner: (t: SimpleDatabaseTransaction) => Promise<T>
  ) => Promise<T>
}

export interface SimpleDatabaseTransaction {
  transaction: <T> (
    inner: (t: SimpleDatabaseTransaction) => Promise<T>
  ) => Promise<T>

  enqueueAfterCommit(callback: () => void): void

  legacy: {
    database: LegacyDatabase
    transaction: LegacyTransaction
  }
}

export function fromLegacy(database: LegacyDatabase): SimpleDatabase {
  return {
    legacy: database,
    transaction: (inner) => database.transaction((legacyTransaction) => inner(fromLegacyTransaction(database, legacyTransaction)))
  }
}

function fromLegacyTransaction(database: LegacyDatabase, legacyTransaction: LegacyTransaction): SimpleDatabaseTransaction {
  return {
    transaction: (inner) => database.transaction(
      (innerTransaction) => inner(fromLegacyTransaction(database, innerTransaction)),
      { transaction: legacyTransaction }
    ),
    enqueueAfterCommit: (afterCommitAction) => legacyTransaction.afterCommit(afterCommitAction),
    legacy: {
      database,
      transaction: legacyTransaction
    }
  }
}
