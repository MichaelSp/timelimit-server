import { X509Certificate } from 'crypto'
import { Request } from 'express'
import { fromBER, Sequence, Integer, OctetString, Set } from 'asn1js'
import { Certificate } from 'pkijs'

export interface CertInfo {
  applicationCerts: Array<string>
}

export function analyze(req: Request): CertInfo | null {
  try {
    const certStr = req.headers['clientcertificate']

    if (typeof certStr !== 'string') return null

    const nativeCert = new X509Certificate(decodeURIComponent(certStr))

    const now = Date.now()
    const from = Date.parse(nativeCert.validFrom)
    const to = Date.parse(nativeCert.validTo)

    if (from > now || to < now) return null
    if (from > to || from + 1000 * 60 * 5 < to) return null

    const cert1 = fromBER(nativeCert.raw)

    if (cert1.offset === -1) return null

    const cert2 = new Certificate({ schema: cert1.result })
    const androidExtension = (cert2.extensions || []).find((item) => item.extnID === '1.3.6.1.4.1.11129.2.1.17')?.extnValue?.valueBlock?.valueHexView

    if (!androidExtension) return null

    const androidExtensionParsed = fromBER(androidExtension)

    if (androidExtensionParsed.offset === -1) return null

    const androidExtensionSequence = androidExtensionParsed.result

    if (!(androidExtensionSequence instanceof Sequence)) return null

    const versionInteger = androidExtensionSequence.valueBlock.value[0]

    if (!(versionInteger instanceof Integer)) return null

    const versionValue = versionInteger.valueBlock.valueDec

    const authorizationLists = androidExtensionSequence.valueBlock.value.slice(6, 8)

    let applicationId = null

    for (const authList of authorizationLists) {
      if (!(authList instanceof Sequence)) continue

      for (const authListItem of authList.valueBlock.value) {
        if (
          // version 1 does not provide this data structure
          versionValue !== 1 &&
          authListItem.idBlock.tagNumber === 709
        ) {
          if (!('value' in authListItem.valueBlock)) continue

          const value = (authListItem.valueBlock as unknown as { value: object }).value

          if (!Array.isArray(value) || value.length !== 1) continue

          if (value[0] instanceof OctetString) applicationId = value[0]
        }
      }
    }

    if (!applicationId) return null

    const parsedApplicationId = fromBER(applicationId.valueBlock.valueHexView)

    if (parsedApplicationId.offset === -1) return null

    if (!(parsedApplicationId.result instanceof Sequence)) return null

    const parsedApplicationIdInfo = parsedApplicationId.result.valueBlock.value

    if (parsedApplicationIdInfo.length !== 2) return null

    const signatureDigests = parsedApplicationIdInfo[1]

    if (!(signatureDigests instanceof Set)) return null

    const applicationCerts = []

    for (const cert of signatureDigests.valueBlock.value) {
      if (cert instanceof OctetString) {
        applicationCerts.push(Buffer.from(cert.valueBlock.valueHexView).toString('hex'))
      }
    }

    return {
      applicationCerts
    }
  } catch (ex) {
    return null
  }
}
