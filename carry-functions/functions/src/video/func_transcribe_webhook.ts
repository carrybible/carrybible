import { RuntimeOptions, runWith } from 'firebase-functions'
import axios from 'axios'
import { Service } from '../shared'
import { handleYouTube, Video } from './func_process_video'
import { Slack, Mailchimp } from './'


const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}
const db = Service.Firebase.firestore()
const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] '

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else if (req.method === "POST") {

    const videoId: string = req.body.video_id;
    const transcribeResultsUrl: string = req.body.transcribe_results_url;

    if (videoId && transcribeResultsUrl) {
      try {
        await handleWebhook(videoId, transcribeResultsUrl)
      } catch (e) {
        console.log(e)
        throw (e);
      } finally {
        res.status(200).send();
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

async function handleWebhook(videoId: string, transcribeResultsUrl: string) {

  console.log(`Video with id ${videoId} has finished transcribing with results at ${transcribeResultsUrl}`)

  const videoRef = db.collection('videos').doc(videoId);
  const video = (await videoRef.get()).data() as Partial<Video>
  const hadVideoErrors = (video?.errors || []).length > 0

  try {
    if (!video) throw Error(`Cannot find video ${videoId}`)

    const transcribeResults = (await axios.get(transcribeResultsUrl)).data

    if (transcribeResults.results.language_code.slice(0, 2) !== 'en') {
      console.log("Not english")
    } else {
      let transcript = transcribeResults.results.transcripts[0].transcript;

      let transcriptSplit = transcript.split(' ');

      console.log(`Parsed transcript with ${transcriptSplit.length} words`)

      // cap to 30000 words at the end
      if (transcriptSplit.length > 30000) {
        transcriptSplit = transcriptSplit.slice(-30000);
        transcript = transcriptSplit.join(" ");
      }

      video.sermonSubtitles = transcript;
      video.youTubeVideoTranscribeResultsUrl = transcribeResultsUrl;

      if (video.youTubeVideoUrl && video.youTubeVideoId && video.email && video.offset !== undefined && (video.origin === 'website' || video.origin === 'dashboard')) {
        console.log(`Processing transcribed video from db ${video.youTubeVideoId}`)
        await handleYouTube(video.youTubeVideoUrl, video.origin, video.email, video.offset, video.orgId, video.campusId, video.params, video.author, video)
      } else {
        console.log(video);
        throw new Error('Transcribed video does not have the correct fields')
      }
    }
  } catch (e) {

    if (e instanceof Error) {
      console.log(e);

      try {
        await Slack.sendGrowthAlertMessage(`Error recieving transcription results for ${videoId} from ${transcribeResultsUrl} ${e.message} `)
      } catch (e) {
        console.error(`Problem sending slack message`);
      }

      try {
        if (!hadVideoErrors && video.email) {

          await Mailchimp.sendEmailTemplate(
            'Carry',
            'hello@carrybible.com',
            'growth-experiment-error-processing',
            devPrefix + 'Problem with your study ⚠️',
            video.email,
            video.email,
          )
        }
      } catch (e) {
        console.error(`Problem sending email`);
      }

      throw (e);
    }
  }
}

