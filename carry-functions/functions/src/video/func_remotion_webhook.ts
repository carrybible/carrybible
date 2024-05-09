import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service, } from '../shared'
import { Slack, Mailchimp, Branch, Plan, Webflow } from './'
import { Video } from './func_process_video'
import { OpenAIPlan } from './OpenAI';
import { ScheduledPlan } from './Plan';
import { WebflowStudy } from './Webflow';

const db = Service.Firebase.firestore()

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] '
const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'

type WebhookPayload =
  | {
    type: "error";
    errors: {
      message: string;
      name: string;
      stack: string;
    }[];
    renderId: string;
    expectedBucketOwner: string;
    bucketName: string;
  }
  | {
    type: "success";
    lambdaErrors: any[];
    outputUrl: string | undefined;
    outputFile: string | undefined;
    timeToFinish: number | undefined;
    renderId: string;
    expectedBucketOwner: string;
    bucketName: string;
  }
  | {
    type: "timeout";
    renderId: string;
    expectedBucketOwner: string;
    bucketName: string;
  };

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    try {
      const payload: WebhookPayload = req.body;
      const renderId = payload.renderId;
      if (payload.type === 'success' && payload.outputUrl) {

        const videoUrl = payload.outputUrl;

        console.log(`Video with render id ${renderId} has finished rendering ${videoUrl}`)
        await handleWebhook(renderId, videoUrl)
      } else if (payload.type === "error") {
        let errorMessage = "";
        for (const error of payload.errors) {
          errorMessage += error.name + " " + error.message + '\n'
        }
        await handleError(renderId, errorMessage)
        throw new Error(`${renderId} has errored: ${payload.errors[0].message}`)
      } else if (payload.type === "timeout") {
        await handleError(renderId, "Render has timed out")
        throw new Error(`${renderId} has timed out`)
      } else {
        const bodyString: string = JSON.stringify(req?.body)
        console.log(bodyString)
        throw new Error("Unexpected webhook body")
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.stack || e.message)
        console.log("Cannot process remotion webhook " + req.errored?.stack || req.errored?.message)
        throw new Error(e.stack || e.message)
      }
    } finally {
      res.status(200).json({ success: true })
    }
  } else {
    res.status(405).send()
  }
})

async function handleError(renderId: string, error: string) {

  console.error(`Error processing ${renderId} ${error}`)

  let youTubeVideoUrl = "";
  let email = "";

  try {
    const videoQuery = (await db.collection('videos').where("renderId", "==", renderId).get()).docs;
    if (videoQuery.length < 1) throw new Error(`Cannot find any videos with Render ID ${renderId}`);
    const videoRef = videoQuery[0];
    const video = await videoRef.data() as Video
    const hadVideoErrors = (video.errors || []).length > 0

    email = video.email;
    youTubeVideoUrl = video.youTubeVideoUrl;

    if (!hadVideoErrors) {

      await Mailchimp.sendEmailTemplate(
        'Carry',
        'hello@carrybible.com',
        'growth-experiment-error-processing',
        devPrefix + 'Problem with your study ⚠️',
        email,
        email,
      )
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Cannot send email`)
      console.log(e.stack)
    }
  }

  // slack notification
  try {
    await Slack.sendGrowthAlertMessage(`Error processing ${renderId} for ${email} using ${youTubeVideoUrl}: ${error}`)
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Cannot log slack message`)
      console.log(e.stack)
      throw (e)
    }
  }

  /*
  const videoRef = await (await db.collection('videos').where("renderId", "==", renderId).get()).docs[0];
  const videoId = videoRef.id;
  const video = await videoRef.data() as any
  let remotionTries = video?.remotionTries
  if (!remotionTries) remotionTries = 1;
  if (remotionTries < 3) {

    remotionTries++;
    await db.collection('videos').doc(videoId).update({ remotionTries: remotionTries, })
  } else {

  }*/
}

async function handleWebhook(renderId: string, processedVideoLink: string) {

  let hadVideoErrors = false;
  let videoAddedToDb = false;
  const videoUpdate: Partial<Video> = {
    processedVideoLink: processedVideoLink
  };
  let videoId;
  let slackLink = processedVideoLink;

  try {

    const renderRef = db.collection('renders').doc(renderId);
    let render = (await renderRef.get()).data();

    if (render && render.groupId && render.groupVideoId) {
      // render has come from scheduling a plan to a group

      await db.collection('groups').doc(render.groupId).collection('videos').doc(render.groupVideoId).update({ videoUrl: processedVideoLink })
    } else {
      if (render && render.videoId) {
        videoId = render.videoId
      } else if (!render) {
        const videoQuery = (await (db.collection('videos').where("renderId", "==", renderId).get())).docs;
        if (videoQuery.length < 1) throw new Error(`Cannot find any videos with Render ID ${renderId}`);
        videoId = videoQuery[0].id;
      }

      console.log(`Found video with video ID ${videoId}`)
      const videoRef = db.collection('videos').doc(videoId);
      const video = (await videoRef.get()).data() as Video
      hadVideoErrors = (video.errors || []).length > 0

      const carryPlan: OpenAIPlan = JSON.parse(video.planData);
      carryPlan.planVideo = processedVideoLink;

      if (!video.planScheduled && video.origin === 'website') {

        const scheduledPlan: ScheduledPlan | undefined = await Plan.pushPlanToGroup(carryPlan, video.groupId, video.offset, true)

        if (!scheduledPlan) {
          throw new Error(`Not able to push plan to group ${video.groupId}`)
        }

        videoUpdate.planScheduledId = scheduledPlan.id;
        videoUpdate.planStartDate = scheduledPlan.startDate;
        videoUpdate.planEndDate = scheduledPlan.endDate;
        videoUpdate.planScheduled = true;

        const processedVideoShortLink = await Branch.createBranchShortLink(processedVideoLink);
        videoUpdate.processedVideoShortLink = processedVideoShortLink;
      }

      if (video.planAddedToOrg && video.planLibraryId) {
        await Plan.updatePlanToOrg(video.planLibraryId, carryPlan, video.orgId, video.campusId)
      } else {
        const planLibraryId = await Plan.pushPlanToOrg(carryPlan, video.orgId, video.campusId);
        videoUpdate.planLibraryId = planLibraryId;
      }



      const yearMonth = new Date().getFullYear() + "-" + new Date().getMonth();
      const orgRef = db.collection("organisations").doc(video.orgId)
      const orgData = (await orgRef.get()).data();
      let videoCount: number = orgData?.videoCounts?.[yearMonth] || 0;
      videoCount++;

      let videoCounts = orgData?.videoCounts

      if (!videoCounts) {
        videoCounts = {};
        videoCounts[yearMonth] = videoCount
      } else {
        videoCounts[yearMonth] = videoCount;
      }

      await orgRef.update({ videoCounts: videoCounts });

      if (hadVideoErrors) throw new Error("Video had errors in generations, so skipping content ready email")



      if (video.origin === 'website') {

        if (!video.planTextVersion || video.planTextVersion.length !== 7) throw new Error('Cannot find plan text version to render on study page')

        const studySlug = isDev ? `dev-${video.videoId}` : video.videoId;
        const studyLink = `https://carrybible.com/studies/${studySlug}`;
        videoUpdate.studySlug = studySlug;
        videoUpdate.studyLink = studyLink;

        const webflowStudy: WebflowStudy = {
          slug: studySlug,
          studyName: video.planName,
          groupName: video.youTubeChannelName,
          videoUrl: processedVideoLink,
          day1Text: video.planTextVersion[0],
          day2Text: video.planTextVersion[1],
          day3Text: video.planTextVersion[2],
          day4Text: video.planTextVersion[3],
          day5Text: video.planTextVersion[4],
          day6Text: video.planTextVersion[5],
          day7Text: video.planTextVersion[6],
          inviteLink: video.groupInviteUrl,
          inviteCode: video.groupInviteCode,
          videoId: video.videoId,
          dev: isDev,
          email: video.email
        }

        const addedStudy = await Webflow.addStudyToWebflow(webflowStudy);

        if (!addedStudy) throw new Error('Could not update study')

        slackLink = studyLink;

        const mergeVars = [
          {
            name: 'LOGINLINK',
            content: studyLink,
          },
          {
            name: 'IMAGEURL',
            content: video.youTubeVideoThumbnail
          },
        ]

        console.log(`Sending email to ${video.email} `)

        await Mailchimp.sendEmailTemplate(
          'Carry',
          'hello@carrybible.com',
          'growth-experiment-video-ready',
          devPrefix + 'Your sermon content is ready! 🎉',
          video.email,
          video.email,
          mergeVars,
        )

      }

      await db.collection('videos').doc(videoId).update(videoUpdate);
      videoAddedToDb = true;

      await db.collection('organisations').doc(video.orgId).collection('videos').doc().set(video);

      if (!isDev) await Slack.sendGrowthAlertMessage(`New video processed ${slackLink} from ${video.email} using ${video.youTubeVideoUrl}`);
    }

  } catch (e) {
    if (e instanceof Error) {
      console.error(e)

      if (!videoAddedToDb) {
        try {
          if (videoId) {
            await db.collection('videos').doc(videoId).update(videoUpdate);
            console.log(`Video id ${videoId} updated in db`)
          } else {
            await addRenderedVideoToDb(renderId, processedVideoLink);
            console.log(`Added video information to db as orphan`)
          }
        } catch (e) {
          console.log(e)
        }
      }

      if (!hadVideoErrors) {

        // if we had errors then we've already sent an error email
        try {
          const videoRef = await (await db.collection('videos').where("renderId", "==", renderId).get()).docs[0];
          const video = await videoRef.data() as any

          if (video.origin === 'website') {

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
          console.log(e)
        }
      }

      try {
        if (!isDev) await Slack.sendGrowthAlertMessage(`Problem with remotion render ${renderId} ${e.message} `)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

async function addRenderedVideoToDb(
  renderId: string,
  processedVideoLink: string,
) {
  const video = {
    renderId: renderId,
    processedVideoLink: processedVideoLink || '',
    status: "orphan"
  }

  const videoRef = db.collection('videos').doc()
  await videoRef.set(video)
  console.log(`Adding video with video id ${videoRef.id} `)

}