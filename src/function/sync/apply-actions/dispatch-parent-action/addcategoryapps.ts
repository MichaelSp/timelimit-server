/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2022 Jonas Lochmann
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

import * as Sequelize from "sequelize"
import { AddCategoryAppsAction } from "../../../../action"
import { CategoryAppAttributes } from "../../../../database/categoryapp"
import {
  getCategoryWithParentCategories,
  GetParentCategoriesException,
} from "../../../../util/category"
import { Cache } from "../cache"
import { SourceUserNotFoundException } from "../exception/illegal-state"
import { MissingCategoryException } from "../exception/missing-item"
import {
  CanNotModifyOtherUsersBySelfLimitationException,
  SelfLimitationException,
} from "../exception/self-limit"

export async function dispatchAddCategoryApps({
  action,
  cache,
  fromChildSelfLimitAddChildUserId,
}: {
  action: AddCategoryAppsAction
  cache: Cache
  fromChildSelfLimitAddChildUserId: string | null
}) {
  const categoryEntryUnsafe = await cache.database.category.findOne({
    where: {
      familyId: cache.familyId,
      categoryId: action.categoryId,
    },
    transaction: cache.transaction,
    attributes: ["childId"],
  })

  if (!categoryEntryUnsafe) {
    throw new MissingCategoryException()
  }

  const { childId } = categoryEntryUnsafe

  if (fromChildSelfLimitAddChildUserId !== null) {
    if (childId !== fromChildSelfLimitAddChildUserId) {
      throw new CanNotModifyOtherUsersBySelfLimitationException()
    }
  }

  const categoriesOfSameChild = (
    await cache.database.category.findAll({
      where: {
        familyId: cache.familyId,
        childId,
      },
      attributes: ["categoryId", "parentCategoryId"],
      transaction: cache.transaction,
    })
  ).map((item) => ({
    categoryId: item.categoryId,
    parentCategoryId: item.parentCategoryId,
  }))

  const userCategoryIds = categoriesOfSameChild.map((item) => item.categoryId)

  const oldCategories = (
    await cache.database.categoryApp.findAll({
      attributes: ["categoryId"],
      group: ["categoryId"],
      where: {
        familyId: cache.familyId,
        categoryId: {
          [Sequelize.Op.in]: userCategoryIds,
        },
        packageName: {
          [Sequelize.Op.in]: action.packageNames,
        },
      },
      transaction: cache.transaction,
    })
  ).map((item) => item.categoryId)

  if (fromChildSelfLimitAddChildUserId !== null) {
    for (let i = 0; i < action.packageNames.length; i++) {
      const packageName = action.packageNames[i]

      if (packageName.indexOf("@") !== -1) {
        throw new SelfLimitationException({
          staticMessage: "can not do device specific assignments as child",
        })
      }
    }

    try {
      const parentCategoriesOfTargetCategory = getCategoryWithParentCategories(
        categoriesOfSameChild,
        action.categoryId,
      )
      const userEntryUnsafe = await cache.database.user.findOne({
        attributes: ["categoryForNotAssignedApps"],
        where: {
          familyId: cache.familyId,
          userId: fromChildSelfLimitAddChildUserId,
        },
        transaction: cache.transaction,
      })

      if (!userEntryUnsafe) {
        throw new SourceUserNotFoundException()
      }

      const userEntry = {
        categoryForNotAssignedApps: userEntryUnsafe.categoryForNotAssignedApps,
      }
      const validatedDefaultCategoryId = categoriesOfSameChild.find(
        (item) => item.categoryId === userEntry.categoryForNotAssignedApps,
      )?.categoryId
      const allowUnassignedElements =
        validatedDefaultCategoryId !== undefined &&
        parentCategoriesOfTargetCategory.indexOf(validatedDefaultCategoryId) !==
          -1

      const assertCanAddApp = async (packageName: string, isApp: boolean) => {
        const categoryAppEntryUnsafe = await cache.database.categoryApp.findOne(
          {
            attributes: ["categoryId"],
            where: {
              familyId: cache.familyId,
              categoryId: {
                [Sequelize.Op.in]: userCategoryIds,
              },
              packageName: packageName,
            },
            transaction: cache.transaction,
          },
        )

        const categoryAppEntry = categoryAppEntryUnsafe
          ? { categoryId: categoryAppEntryUnsafe.categoryId }
          : null

        if (categoryAppEntry === null) {
          if ((isApp && allowUnassignedElements) || !isApp) {
            // allow
          } else {
            throw new SelfLimitationException({
              staticMessage: "can not assign apps without category as child",
            })
          }
        } else {
          if (
            parentCategoriesOfTargetCategory.indexOf(
              categoryAppEntry.categoryId,
            ) !== -1
          ) {
            // allow
          } else {
            throw new SelfLimitationException({
              staticMessage:
                "can not add app which is not contained in the parent category as child",
            })
          }
        }
      }

      for (let i = 0; i < action.packageNames.length; i++) {
        const packageName = action.packageNames[i]

        if (packageName.indexOf(":") !== -1) {
          await assertCanAddApp(
            packageName.substring(0, packageName.indexOf(":")),
            true,
          )
          await assertCanAddApp(packageName, false)
        } else {
          await assertCanAddApp(packageName, true)
        }
      }
    } catch (ex) {
      if (ex instanceof GetParentCategoriesException) {
        throw new MissingCategoryException()
      } else throw ex
    }
  }

  if (oldCategories.length > 0) {
    await cache.database.categoryApp.destroy({
      where: {
        familyId: cache.familyId,
        categoryId: {
          [Sequelize.Op.in]: categoriesOfSameChild.map(
            (item) => item.categoryId,
          ),
        },
        packageName: {
          [Sequelize.Op.in]: action.packageNames,
        },
      },
      transaction: cache.transaction,
    })
  }

  await cache.database.categoryApp.bulkCreate(
    action.packageNames.map(
      (packageName): CategoryAppAttributes => ({
        familyId: cache.familyId,
        categoryId: action.categoryId,
        packageName,
      }),
    ),
    {
      transaction: cache.transaction,
    },
  )

  oldCategories.forEach((categoryId) =>
    cache.categoriesWithModifiedApps.add(categoryId),
  )
  cache.categoriesWithModifiedApps.add(action.categoryId)
  cache.incrementTriggeredSyncLevel(2)
}
