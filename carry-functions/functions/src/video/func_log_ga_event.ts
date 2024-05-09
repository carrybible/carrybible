import { RuntimeOptions, runWith } from 'firebase-functions'
import axios, { AxiosResponse } from 'axios'

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

const gaUrl = 'https://www.google-analytics.com/mp/collect?api_secret=&measurement_id='

const data = {
  client_id: 'manual_event_log',
  events: [{ name: 'test' }],
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    let response: AxiosResponse

    try {
      const postConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      }

      response = await axios.post(gaUrl, data, postConfig)

      res.status(response.status).send(response.data)
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response) {
          console.log('response error')
          // Request made and server responded
          console.log(e.response)
        } else if (e.request) {
          console.log('request error error')
          // The request was made but no response was received
          console.log(e.request)
        } else {
          console.log('something else error')
          // Something happened in setting up the request that triggered an Error
          console.log('Error', e.message)
        }
      }
    }
  } else {
    res.status(405).send()
  }
})
