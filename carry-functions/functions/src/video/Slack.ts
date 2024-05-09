import axios from 'axios'
import { Service } from '../shared'

export async function sendGrowthAlertMessage(message: string) {
  const prefix = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : '[Dev]: '

  let success = false
  const newMessage = prefix + message
  const zapierUrl = ''
  const payload = [{ message: newMessage }]

  try {
    await axios.post(zapierUrl, payload)
    success = true
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack)
    }
  }
  return success
}

export async function sendLoggingMessage(message: string) {
  const prefix = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : '[Dev]: '

  let success = false
  const slackUrl = ''
  const newMessage = prefix + message
  const payload = [{ text: newMessage }]

  try {
    await axios.post(slackUrl, payload)
    success = true
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack)
    }
  }
  return success
}

export default {
  sendGrowthAlertMessage,
  sendLoggingMessage,
}
