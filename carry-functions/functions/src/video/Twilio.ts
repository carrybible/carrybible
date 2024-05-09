import Twilio from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

const twilioAccountSid = '';
const twilioAuthToken = '';

const twilio = Twilio(twilioAccountSid, twilioAuthToken);

async function sendSMS(toNumber: string, message: string) {

  const msgData: MessageListInstanceCreateOptions = {
    from: '',
    to: toNumber,
    body: message
  };

  try {
    const messageSend = await twilio.messages.create(msgData)
    console.log(messageSend);
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}

export default {
  sendSMS,
}