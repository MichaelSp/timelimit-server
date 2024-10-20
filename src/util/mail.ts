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

import { compile } from 'ejs'
import { parseOneAddress } from 'email-addresses'
import { readFileSync } from 'fs'
import { createTransport } from 'nodemailer'
import { resolve } from 'path'
import { config } from '../config'
import { IllegalStateException } from '../exception'

const mailimprint = process.env.MAIL_IMPRINT || 'not defined'
const mailServerBlacklist = (process.env.MAIL_SERVER_BLACKLIST || '').split(',').filter((item) => !!item)

const mailSender = process.env.MAIL_SENDER || ''
const mailTransportConfig = JSON.parse(process.env.MAIL_TRANSPORT || 'null') || undefined
const isDevMode = process.env.NODE_ENV === 'development'

const mailTransport = isDevMode || mailTransportConfig !== undefined ?
  createTransport(isDevMode ? {
    jsonTransport: true
  } : mailTransportConfig) :
  null

function createMailTemplateSender (templateName: string) {
  const compileTemplate = (filename: string) => compile(
    readFileSync(resolve(__dirname, '../../other/mail', templateName, filename)).toString('utf8')
  )

  const subjectTemplate = compileTemplate('subject.ejs')
  const textTemplate = compileTemplate('text.ejs')
  const htmlTemplate = compileTemplate('html.ejs')

  const sendMail = async ({ receiver, params, info }: {
    receiver: string
    params: object
    info?: Buffer
  }) => {
    if (!mailTransport) {
      throw new Error('can not send mails without mail config and without NODE_ENV=development')
    }

    const subject = subjectTemplate(params).replace(/\n/g, ' ')
    const text = textTemplate(params)
    const html = htmlTemplate(params)
    const headers: {[key: string]: string} = info ? {
      'X-TlInfo': info.toString('base64')
    } : {}

    await new Promise<void>((resolve, reject) => {
      mailTransport.sendMail({
        from: mailSender,
        to: receiver,
        subject,
        text,
        html,
        headers
      }, (err, info) => {
        if (err) {
          reject(err)
        } else {
          if (isDevMode) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (info as any).message

            console.log(JSON.stringify({
              ...JSON.parse(data),
              params
            }, null, 2))
          }

          resolve()
        }
      })
    })
  }

  return { sendMail }
}

const loginMailSender = createMailTemplateSender('login')

export const sendAuthenticationMail = async ({
  receiver, code, locale, deviceName, info
}: {
  receiver: string
  code: string
  locale: string
  deviceName: string | null
  info: Buffer
}) => {
  await loginMailSender.sendMail({
    receiver,
    params: {
      subject: locale === 'de' ? 'Anmeldung bei TimeLimit' : 'Sign in at TimeLimit',
      introtext: locale === 'de' ? 'Geben Sie zum Authentifizieren folgenden Code in TimeLimit ein' : 'To authenticate, enter the following code in TimeLimit',
      code,
      outrotext: locale === 'de' ? 'Geben Sie diesen Code nicht an Dritte weiter.' : 'Do not share this code with third parties.',
      mailimprint,
      deviceName,
      deviceNameIntro: locale === 'de' ? 'Die Anmeldung wurde am Gerät' : 'The login was attempted at the device',
      deviceNameOutro: locale === 'de' ? 'versucht.' : '.'
    },
    info
  })
}

const manipulationMailSender = createMailTemplateSender('manipulation')

export const sendManipulationWarningMail = async ({ receiver, deviceName }: {
  receiver: string
  deviceName: string
}) => {
  await manipulationMailSender.sendMail({
    receiver,
    params: {
      subject: 'TimeLimit@' + deviceName + ' - Manipulation',
      deviceName,
      mailimprint
    }
  })
}

const uninstallMailSender = createMailTemplateSender('uninstall')

export const sendUninstallWarningMail = async ({ receiver, deviceName }: {
  receiver: string
  deviceName: string
}) => {
  await uninstallMailSender.sendMail({
    receiver,
    params: {
      subject: 'TimeLimit removed from ' + deviceName,
      deviceName,
      mailimprint
    }
  })
}

const taskDoneSender = createMailTemplateSender('taskdone')

export const sendTaskDoneMail = async ({ receiver, child, task }: {
  receiver: string
  child: string
  task: string
}) => {
  await taskDoneSender.sendMail({
    receiver,
    params: { child, task, mailimprint }
  })
}

const deviceLinkedSender = createMailTemplateSender('device-linked-by-mail')

export const sendDeviceLinkedMail = async ({ receiver, deviceName, locale }: {
  receiver: string
  deviceName: string
  locale: string
}) => {
  await deviceLinkedSender.sendMail({
    receiver,
    params: {
      subject: locale === 'de' ? 'Gerät hinzugefügt' : 'Device added',
      preText: locale === 'de' ? 'Soeben wurde das Gerät' : 'The device',
      deviceName,
      postText: locale === 'de' ? 'über Ihre E-Mail-Adresse hinzugefügt.' : 'was added using your mail address.',
      securityText: getMailSecurityText(locale),
      mailimprint
    }
  })
}

const passwordRecoveryUsedMailSender = createMailTemplateSender('password-recovery-used')

export const sendPasswordRecoveryUsedMail = async ({ receiver, locale }: {
  receiver: string
  locale: string
}) => {
  await passwordRecoveryUsedMailSender.sendMail({
    receiver,
    params: {
      subject: locale === 'de' ? 'Passwort-Vergessen-Funktion verwendet' : 'Password reset',
      text: locale === 'de' ?
        'Soeben wurde Ihr TimeLimit-Passwort mit der Passwort-Vergessen-Funktion geändert.' :
        'Your password was changed using the password reset feature.',
      securityText: getMailSecurityText(locale),
      mailimprint
    }
  })
}

const accountDeletedMailSender = createMailTemplateSender('account-deleted')

export const sendAccountDeletedMail = async ({ receiver }: {
  receiver: string
}) => {
  await accountDeletedMailSender.sendMail({
    receiver,
    params: {
      mailimprint
    }
  })
}

function getMailSecurityText (locale: string) {
  if (locale === 'de') {
    return 'Achten Sie darauf, dass Ihr Kind/Ihre Kinder keinen Zugang zu der E-Mail-Adresse hat/haben, die Sie bei TimeLimit angegeben haben.'
  } else {
    return 'Make sure that your child/children can not access the mail addresss that you use for TimeLimit.'
  }
}

export function isMailServerBlacklisted (mail: string): boolean {
  const parts = mail.split('@')
  const domain = parts[parts.length - 1]

  return mailServerBlacklist.indexOf(domain.toLowerCase()) !== -1
}

export function isMailAddressCoveredByWhitelist (mail: string): boolean {
  if (config.mailWhitelist.length === 0) {
    return true
  }

  const mailParts = mail.split('@')
  const mailDomain = mailParts[mailParts.length - 1]

  for (let i = 0; i < config.mailWhitelist.length; i++) {
    const whtielistItem = config.mailWhitelist[i]

    const isDomain = whtielistItem.indexOf('@') === -1

    if (isDomain) {
      if (mailDomain === whtielistItem) {
        return true
      }
    } else {
      if (mail === whtielistItem) {
        return true
      }
    }
  }

  return false
}

export function sanitizeMailAddress (input: string): string | null {
  const parsed = parseOneAddress(input)

  if ((!parsed) || (parsed.type !== 'mailbox')) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address = (parsed as any).address

  if (typeof address !== 'string') {
    throw new IllegalStateException({ staticMessage: 'mail address is not a string' })
  }

  return address
}
