/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2026 Jonas Lochmann
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3 of the License.
 */

import { AppLogicAction } from './basetypes.js'
import { InvalidActionParameterException } from './meta/exception.js'

const actionType = 'UpdateDesktopInventoryAction'
const SIZE_LIMIT = 512 * 1024
const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

/**
 * Replaces one opaque format-3 desktop inventory container. It intentionally
 * has no base/diff/wipe fields, and must never be decoded by the server.
 */
export class UpdateDesktopInventoryAction extends AppLogicAction {
  readonly ciphertext: Buffer

  constructor({ ciphertext }: { ciphertext: Buffer }) {
    super()

    if (ciphertext.length === 0 || ciphertext.length > SIZE_LIMIT) {
      throw new InvalidActionParameterException({
        actionType,
        staticMessage: 'ciphertext size invalid',
      })
    }

    this.ciphertext = ciphertext
  }

  static parse = ({ data }: SerializedUpdateDesktopInventoryAction) => {
    // Buffer.from silently accepts malformed input and non-zero base64 pad
    // bits. Decode and re-encode exactly so the stored opaque bytes have one
    // wire representation only.
    const ciphertext = Buffer.from(data, 'base64')
    if (!base64Pattern.test(data) || ciphertext.toString('base64') !== data) {
      throw new InvalidActionParameterException({
        actionType,
        staticMessage: 'invalid ciphertext encoding',
      })
    }

    return new UpdateDesktopInventoryAction({
      ciphertext,
    })
  }
}

export interface SerializedUpdateDesktopInventoryAction {
  type: 'UPDATE_DESKTOP_INVENTORY'
  /** @minLength 1 @maxLength 699052 */
  data: string
}
