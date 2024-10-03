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

import { IABVerifier } from "./iab_verifierr"

export const googlePlayPublicKey = process.env.GOOGLE_PLAY_PUBLIC_KEY || ""

const verifier =
  googlePlayPublicKey !== "" ? new IABVerifier(googlePlayPublicKey) : null

export const areGooglePlayPaymentsPossible = !!verifier
export const isGooglePlayPurchaseSignatureValid = ({
  receipt,
  signature,
}: {
  receipt: string
  signature: string
}) => {
  if (verifier) {
    return verifier.verifyReceipt(receipt, signature)
  } else {
    return false
  }
}
