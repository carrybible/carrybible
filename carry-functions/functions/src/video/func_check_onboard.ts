import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { Onboarding } from './func_onboard';


const db = Service.Firebase.firestore();

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else if (req.method === "GET") {

    const onboardingId = req.query.id as string;

    let status = 400;
    let response: { success: boolean, data: any } = {
      success: false,
      data: {}
    }

    if (onboardingId) {
      try {
        const onboardingRef = await db.collection('onboardings').doc(onboardingId).get();

        if (onboardingRef.exists) {

          response.success = true;

          const onboarding = onboardingRef.data() as Onboarding;
          //console.log(onboarding);

          if (onboarding.setupOption === 'group') {
            response.data = {
              setup_option: 'group',
              group_invite_url: onboarding.groupInviteUrl,
              group_invite_code: onboarding.groupInviteCode,
              group_invite_qr_code_url: onboarding.groupInviteQrCodeUrl
            }

          } else if (onboarding.setupOption === 'dashboard') {
            response.data = {
              setup_option: 'dashboard',
              email: onboarding.email
            }
          }

          status = 200;
        } else {
          status = 404;
        }
      } catch (e) {
        console.log(e)
      } finally {
        res.status(status).send(response);
      }
    } else {
      console.log(req.body)
      console.error('Webhook did not have correct parameters')
      res.status(400).send('Incorrect parameters');
    }
  } else {
    res.status(405).send();
  }
})

