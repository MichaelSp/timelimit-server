import { ParentAction } from "./basetypes.js"
import { assertIdWithinFamily } from "./meta/util.js"
import { isDesktopBundleId } from "../database/desktopassignment.js"

export class SetDesktopAppCategoryAction extends ParentAction {
  readonly deviceId: string
  readonly childId: string
  readonly bundleId: string
  readonly categoryId: string

  constructor({ deviceId, childId, bundleId, categoryId }: {
    deviceId: string
    childId: string
    bundleId: string
    categoryId: string
  }) {
    super()
    assertIdWithinFamily({ actionType: "SetDesktopAppCategoryAction", field: "deviceId", value: deviceId })
    assertIdWithinFamily({ actionType: "SetDesktopAppCategoryAction", field: "childId", value: childId })
    if (categoryId !== "") assertIdWithinFamily({ actionType: "SetDesktopAppCategoryAction", field: "categoryId", value: categoryId })
    if (!isDesktopBundleId(bundleId)) throw new Error("invalid desktop bundle identity")
    this.deviceId = deviceId
    this.childId = childId
    this.bundleId = bundleId
    this.categoryId = categoryId
  }

  static parse = (value: SerializedSetDesktopAppCategoryAction) => new SetDesktopAppCategoryAction(value)
}

export interface SerializedSetDesktopAppCategoryAction {
  type: "SET_DESKTOP_APP_CATEGORY"
  deviceId: string
  childId: string
  bundleId: string
  categoryId: string
}
