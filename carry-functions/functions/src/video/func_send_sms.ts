import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { Twilio } from '.'


const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
}
const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] '


const responseData = {
  success: false,
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else if (req.method === "POST") {

    const phoneNumber: string = req.body.phone_number
    const message: string = req.body.message

    if (phoneNumber && message) {
      try {
        console.log(`Attempting to send ${message} to  ${phoneNumber}`)
        const sentSms = await Twilio.sendSMS(phoneNumber, devPrefix + message);
        responseData.success = sentSms;
      } catch (e) {
        console.log(e)
        throw (e);
      } finally {
        res.status(200).send(responseData);
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

