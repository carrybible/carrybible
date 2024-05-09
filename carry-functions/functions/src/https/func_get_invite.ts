import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { genInviteCode } from './func_generate_code'
import { generateQrFromInviteId } from './func_generate_invite_qr_code'

const db = Service.Firebase.firestore()

const failResponse = (message: string) => {
  return {
    success: false,
    errorMessage: message,
  }
}

const successResponse = ({
  inviteUrl,
  inviteQrCodeUrl,
  inviteCode,
}: {
  inviteUrl: string
  inviteQrCodeUrl: string
  inviteCode: string
}) => {
  return {
    success: true,
    data: {
      inviteUrl,
      inviteQrCodeUrl,
      inviteCode,
    },
  }
}

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  let inviteId = req.query.inviteId as string | undefined
  let inviteCode = req.query.inviteCode as string | undefined

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  try {
    if (inviteCode && !inviteId) {
      inviteId = await getInviteIdFromInviteCode(inviteCode)
    }

    if (!inviteId) throw new Error('Could not find invite id')

    const inviteRef = db.collection('invites').doc(inviteId)
    const inviteData = (await inviteRef.get()).data() as Carry.Invite | undefined
    const qrCodeUrl = await generateQrFromInviteId(inviteId)

    if (!inviteCode) {
      const { success, data: inviteCodeData, message } = await genInviteCode({ groupId: inviteData?.groupId })
      if (!success) {
        throw new Error(message)
      }
      inviteCode = inviteCodeData.code
    }

    if (!inviteCode) throw new Error('Could not find invite code')

    res.status(200).json(
      successResponse({
        inviteUrl: inviteData?.url!,
        inviteQrCodeUrl: qrCodeUrl,
        inviteCode: inviteCode,
      }),
    )
    return
  } catch (error: any) {
    res.status(200).json(failResponse(error.message))
  }
})

async function getInviteIdFromInviteCode(inviteCode: string) {
  const codeData = (await db.collection('codes').doc(inviteCode).get()).data() as Carry.Codes

  if (codeData) {
    const groupId = codeData.groupId

    if (groupId) {
      const invites = await (await db.collection('invites').where('groupId', '==', groupId).limit(1).get()).docs

      if (invites.length > 0) {
        return invites[0].id
      }
    }
  }

  return undefined
}
