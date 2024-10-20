/*
 * server component for the TimeLimit App
 * Copyright (C) 2019 - 2024 Jonas Lochmann
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

// note: some configuration parameters are read directly at the location where they are used
interface Config {
  mailWhitelist: Array<string>
  disableSignup: boolean
  pingInterval: number
  alwaysPro: boolean
  signSecret: string
  uaMailBlocklist: Array<string>
}

function parseYesNo (value: string) {
  if (value === 'yes') {
    return true
  } else if (value === 'no') {
    return false
  } else {
    throw new ParseYesNoException('invalid value "' + value + '", expected "yes" or "no"')
  }
}

function parseList(list: string) {
  return list.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
}

class ParseYesNoException extends Error {}

export const config: Config = {
  mailWhitelist: parseList(process.env.MAIL_WHITELIST || ''),
  disableSignup: parseYesNo(process.env.DISABLE_SIGNUP || 'no'),
  pingInterval: parseInt(process.env.PING_INTERVAL_SEC || '25', 10) * 1000,
  alwaysPro: process.env.ALWAYS_PRO ? parseYesNo(process.env.ALWAYS_PRO) : false,
  signSecret: process.env.SIGN_SECRET || '',
  uaMailBlocklist: parseList(process.env.UA_MAIL_BLOCKLIST || '')
}
