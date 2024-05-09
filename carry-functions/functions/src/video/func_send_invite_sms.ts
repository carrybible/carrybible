import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { Twilio, MailchimpMarketing } from './'
import { Video } from './func_process_video'

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
}
const db = Service.Firebase.firestore()
/*const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] '*/

const responseData = {
  success: false,
}
const MAILCHIMP_AUDIENCE_ID = ''

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    const videoId: string = req.body.video_id
    const phoneNumber: string = req.body.phone_number
    const owner: boolean = req.body.owner || false

    if (videoId && phoneNumber) {
      try {
        await handleWebhook(videoId, phoneNumber, owner)
      } catch (e) {
        console.log(e)
        throw e
      } finally {
        res.status(200).send(responseData)
      }
    } else {
      console.log(req.body)
      console.error('Webhook did not have correct parameters')
      res.status(400).send('Incorrect parameters')
    }
  } else {
    res.status(405).send()
  }
})

async function handleWebhook(videoId: string, phoneNumber: string, owner: boolean) {
  console.log(`Attempting to invite ${phoneNumber} for video ${videoId}`)

  const videoRef = db.collection('videos').doc(videoId)
  const video = (await videoRef.get()).data() as Video | undefined

  if (video) {
    const inviteUrl = video.groupInviteUrl
    const inviteCode = video.groupInviteCode
    const planName = video.planName
    const planNameText = planName ? `the "${planName}"` : `a`

    const memberInviteMessage = `Hey there! 👋
You’ve been invited to join a Bible study group in the Carry app. Your group is currently connecting over ${planNameText} 7-day study. Don’t miss out on the discussion!
1. Tap the link below to download the Carry app
2. Join your group using invite code: ${inviteCode}
${inviteUrl}
Reply STOP to opt-out.`

    const ownerInviteMessage = `Your Carry group is ready to join!
1. Tap the link below to download the Carry app
2. Join your group using invite code: ${inviteCode}
${inviteUrl}
Reply STOP to opt-out.`

    const inviteMessage = owner ? ownerInviteMessage : memberInviteMessage

    const sentSms = await Twilio.sendSMS(phoneNumber, inviteMessage)

    responseData.success = sentSms

    if (owner) {
      await videoRef.update({ ownerPhoneNumber: phoneNumber })

      const mergeFields = {
        PHONE: phoneNumber,
      }

      await MailchimpMarketing.updateMemberData(MAILCHIMP_AUDIENCE_ID, video.email, mergeFields)
    }
  }
}
