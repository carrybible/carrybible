import { getStorage } from 'firebase-admin/storage'
import { logger, RuntimeOptions, runWith } from 'firebase-functions'
import fs from 'fs'
import md5 from 'md5'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { Branch, Service } from '../shared'
import { SPECIAL_ORGANISATION } from '../shared/Constants'

const { JSDOM } = require('jsdom')
const nodeCanvas = require('canvas')
// qr-code-styling is not supported Node env by default, qr-code-styling-node is a fork
// that add this functionality, but it's not well covered. Need to add many polyfill to make
// the package works
// Reference: https://github.com/kozakdenys/qr-code-styling/issues/9
global.window = new JSDOM().window
global.self = global.window
global.document = global.window.document
const { QRCodeStyling } = require('qr-code-styling-node/lib/qr-code-styling.common.js')

const db = Service.Firebase.firestore()
const storage = getStorage().bucket()
const QR_CODE_OPTION = {
  width: 300,
  height: 300,
  type: 'svg',
  margin: 0,
  qrOptions: {
    typeNumber: 0,
    mode: 'Byte',
    errorCorrectionLevel: 'H',
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 0,
  },
  dotsOptions: {
    type: 'extra-rounded',
    gradient: {
      type: 'linear',
      rotation: 0.7853981633974483,
      colorStops: [
        {
          offset: 0,
          color: '#1d1d21',
        },
        {
          offset: 1,
          color: '#1d1d21',
        },
      ],
    },
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  image: 'https://uploads-ssl.webflow.com/61f1bef55aea85d115489056/62086a4c460a08e76b419987_Carry.png',
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#1d1d21',
  },
  cornersDotOptions: {
    color: '#1d1d21',
  },
}

const getQRImage = (orgId?: string) => {
  if (!orgId) {
    return QR_CODE_OPTION.image
  }
  if (orgId === SPECIAL_ORGANISATION.WE_CHURCH) {
    return 'https://user-images.githubusercontent.com/1628871/192648430-38d15447-81b9-46fc-85ef-5554e8ec6082.png'
  }
  return QR_CODE_OPTION.image
}

const generateQrCode = async (
  content: string,
  id: string,
  generateRandomIdSuffix = true,
  orgId?: string,
): Promise<string | null> => {
  try {
    const imageId = generateRandomIdSuffix ? `${id}-${uuidv4()}` : id
    const storageDestination = `qrcode/${imageId}.png`

    const uploadedFile = storage.file(storageDestination)
    const exists = await uploadedFile.exists()
    if (exists[0]) {
      return `${uploadedFile.storage.apiEndpoint}/${uploadedFile.bucket.name}/${uploadedFile.name}`
    }

    const qrCodeImage = new QRCodeStyling({
      nodeCanvas,
      jsdom: JSDOM,
      data: content,
      ...QR_CODE_OPTION,
      image: getQRImage(orgId),
    })
    const imagePath = path.resolve('/tmp', `${imageId}.png`)
    const buffer = await qrCodeImage.getRawData('png')
    fs.writeFileSync(imagePath, buffer)
    logger.info(`Saving QR Code image to ${imagePath}`)

    const [file] = await storage.upload(imagePath, {
      destination: storageDestination,
    })
    await file.makePublic()
    const publicUrl = `${file.storage.apiEndpoint}/${file.bucket.name}/${file.name}`
    logger.info(`Uploading QR Code image to remote ${publicUrl}`)

    return publicUrl
  } catch (e) {
    logger.error('Error generating QR Code image', e)
    return null
  }
}

const failResponse = (message: string) => {
  return {
    success: false,
    errorMessage: message,
  }
}

const successResponse = (url: string) => {
  return {
    success: true,
    data: {
      url,
    },
  }
}

export const generateQrFromInviteId = async (inviteId: any, orgId?: string) => {
  if (!inviteId || typeof inviteId !== 'string') {
    throw new Error('Missing or invalid inviteId')
  }

  const inviteRef = db.collection('invites').doc(inviteId)
  const inviteData = (await inviteRef.get()).data() as Carry.Invite | undefined

  if (!inviteData) {
    throw new Error('Invalid inviteId')
  }

  let qrCodeUrl: string | null | undefined = inviteData.qrCodeUrl
  let inviteUrl: string | null = inviteData.url

  if (!qrCodeUrl) {
    let update: any = {}

    if (!inviteUrl) {
      inviteUrl = await Branch.createBranchDynamicLink(inviteId)
      update.inviteUrl = inviteUrl
    }

    logger.info(`Generating QR Code image for inviteId:${inviteId} with content:${inviteData.url}`)
    qrCodeUrl = await generateQrCode(inviteData.url, inviteId, true, orgId)
    update.qrCodeUrl = qrCodeUrl

    await inviteRef.update(update)
  }

  if (!qrCodeUrl) throw Error(`Cannot generate Qr code for invite ${inviteId}`)

  return qrCodeUrl
}

const generateQrFromUrl = async (url: string, orgId?: string) => {
  logger.info(`Generating QR Code image for url:${url}`)
  const id = md5(url)
  return await generateQrCode(url, id, false, orgId)
}

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  const inviteId = req.query.inviteId
  const url = req.query.url
  const orgId = req.query.orgId as string | undefined

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  let qrCodeUrl: string | null

  try {
    if (url && typeof url === 'string') {
      qrCodeUrl = await generateQrFromUrl(url, orgId)
    } else {
      qrCodeUrl = await generateQrFromInviteId(inviteId, orgId)
    }
  } catch (error: any) {
    res.status(200).json(failResponse(error.message))
    return
  }

  if (qrCodeUrl) {
    res.status(200).json(successResponse(qrCodeUrl))
    return
  }
  res.status(200).json(failResponse('Failed to generate QR Code url'))
})
