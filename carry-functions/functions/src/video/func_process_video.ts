import { RuntimeOptions, runWith, config } from 'firebase-functions'
import { renderMediaOnLambda } from '@remotion/lambda/client'
import crypto from 'crypto'

import { Service } from '../shared'
import { Slack, YouTube, OpenAI, CarryUtils, Mailchimp, MailchimpMarketing, Plan } from './'
import { OpenAIPlan } from './OpenAi'
import { CarryPlan } from './Plan'
import axios from 'axios'
export interface Video {
  videoId: string
  email: string
  offset: number
  error?: string
  source: 'youtube'
  origin: 'website' | 'dashboard' | 'group'
  youTubeVideoUrl: string
  youTubeVideoId: string
  youTubeVideoTitle: string
  youTubeVideoDescription: string
  youTubeVideoThumbnail: string
  youTubeVideoLengthSeconds: number
  youTubeVideoIsLive: boolean
  youTubeVideoDirectUrl: string
  youTubeVideoSubtitlesUrl: string
  youTubeVideoSubtitles: string
  youTubeVideoSubtitlesOtherLanguages: boolean
  youTubeVideoValid: boolean
  youTubeVideoSentToTranscribe: boolean
  youTubeVideoTranscribeResultsUrl?: string
  youTubeChannelId: string
  youTubeChannelName: string
  youTubeChannelImage: string
  youTubeVideoTime: number
  youTubeVideoFormat: any
  sermonTitle?: string
  sermonSummary: string
  //sermonSummary: string,
  sermonVerses: Array<string>
  sermonSubtitles: string
  orgId: string
  campusId: string
  groupId: string
  author: string
  groupInviteId: string
  groupInviteUrl: string
  groupInviteCode: string
  groupInviteQrCodeUrl: string
  planName: string
  planData: string
  planOpenAiOutput: string
  planTextVersion: Array<string>
  planVideoVersion: {
    title: string
    passage: string
  }[]
  planGenerator: {
    version: number
    id: string
  }
  planScheduled: boolean
  planAddedToOrg: boolean
  planScheduledId?: string
  planStartDate?: Date
  planEndDate?: Date
  planLibraryId?: string
  renderId: string
  processedVideoLink?: string
  processedVideoShortLink?: string
  glideRowId?: string
  fileName: string
  env: string
  params?: any
  errors?: string[]
  studySlug?: string
  studyLink: string
}
interface InputProps {
  videoUrl: string
  startFrom: number
  churchLogo: string
  bibleStudyTitle: string
  days: { title: string; passage: string }[]
  groupCode: string
}

type AWSRegion =
  | 'eu-central-1'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-2'
  | 'ap-south-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ap-northeast-1'

const db = Service.Firebase.firestore()
db.settings({ ignoreUndefinedProperties: true })

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

const REMOTION_FUNCTION_NAME: string = config().remotion.function_name
const REMOTION_SERVE_URL: string = config().remotion.serve_url
const REMOTION_REGION: AWSRegion = config().remotion.function_region
const REMOTION_AWS_ACCESS_KEY_ID: string = config().remotion.aws_access_key_id
const REMOTION_AWS_SECRET_ACCESS_KEY: string = config().remotion.aws_secret_access_key
const REMOTION_WEBHOOK_URL: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : ''
const NEW_TRANSCRIBE_URL: string = ''

const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : '[Dev] '
const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'

// need to set env variable for remotion to work
process.env.REMOTION_AWS_ACCESS_KEY_ID = REMOTION_AWS_ACCESS_KEY_ID
process.env.REMOTION_AWS_SECRET_ACCESS_KEY = REMOTION_AWS_SECRET_ACCESS_KEY

const MAILCHIMP_AUDIENCE_ID = 'b52e3226c0'

// Shouldn't return a promise in onRequest function, should await and use res obj at the end of the function
export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    const url = req.body.url as string
    const email = req.body.email as string
    const offset = req.body.offset as number
    const orgId = req.body.orgId as string | undefined
    const params = req.body.params as object | undefined

    console.log(`Received new request to process ${url} from ${email} at GMT offset ${offset}`)

    if (url && url !== '' && email && email !== '') {
      if (YouTube.validateYouTubeUrl(url)) {
        try {
          const responsePayload = await handleYouTube(url, 'website', email, offset, params, orgId)
          res.status(200).json(responsePayload)
        } catch (e) {
          if (e instanceof Error) {
            console.log('Server error, responding 400' + e.stack)
          }
          res.status(500).json({ success: false, error: 'Server error' })
        }
      } else {
        res.status(400).send({ error: 'Invalid url provided' })
      }
    } else {
      res.status(400).send({ error: 'Missing data' })
    }
  } else {
    res.status(405).send()
  }
})

export async function handleYouTube(
  url: string,
  origin: 'website' | 'dashboard',
  email?: string,
  offset?: number,
  params?: any,
  orgId?: string,
  campusId?: string,
  author?: string,
  existingVideo?: Partial<Video>,
): Promise<{
  success: boolean
  videoId: string
  planId: string | undefined
}> {
  if (!orgId && !email) throw new Error(`No org id or email, cannot proceed`)

  if (existingVideo) {
    console.info(`Reprocessing video ${existingVideo.videoId}`)
  } else {
    console.info(`Processing YouTube video with url ${url}`)
  }

  const carryVideoId = existingVideo?.videoId || crypto.randomUUID()
  const existingEmail: boolean = email ? await isExistingEmail(email) : false
  const errors: string[] = []

  console.log(`Processing video ${carryVideoId}`)

  let responsePayload: {
    success: boolean
    videoId: string
    planId: string | undefined
  } = {
    success: false,
    videoId: carryVideoId,
    planId: undefined,
  }

  let video: Partial<Video> = existingVideo || {
    videoId: carryVideoId,
    email: email,
    youTubeVideoUrl: url,
    offset: offset,
    youTubeVideoSentToTranscribe: false,
    env: isDev ? 'dev' : 'prod',
    planScheduled: false,
    planAddedToOrg: false,
    source: 'youtube',
    origin: origin,
    orgId: orgId,
    campusId: campusId,
    author: author || CarryUtils.carryUID,
  }

  let canContinue = true

  if (params && !video.params) video.params = params

  try {
    // find org to see if they have credits to be able to use this

    let newOrgId: string | undefined = orgId,
      newCampusId: string | undefined = campusId,
      orgData

    // find the org using the email if we're not provided one
    if (!newOrgId) {
      const orgs = (await db.collection('organisations').where('mainEmail', '==', email).get()).docs

      if (orgs.length > 0) {
        if (orgs.length > 1) console.log(`User have more than one org ${email}`)
        newOrgId = orgs[0].id
      }

      if (!newOrgId) {
        const users = (await db.collection('users').where('email', '==', email).get()).docs

        if (users.length > 0) {
          const user = users[0].data()

          if (
            !(
              user.organisation?.role === 'owner' ||
              user.organisation?.role === 'admin' ||
              user.organisation?.role === 'campus-leader' ||
              user.organisation?.role === 'campus-user'
            )
          ) {
            canContinue = false
            // todo email to say they need added permissions

            // throw new Error(`User ${user.uid} ${email} does not have the correct permissions to generate a plan for org ${user.organisation.id}`)
          }
          newOrgId = users[0].data()?.organisation?.id
        }
      }

      if (!newOrgId) {
        const videos = (await db.collection('videos').where('email', '==', email).limit(1).get()).docs

        if (videos.length > 0) newOrgId = videos[0].data().orgId
      }
    }

    // check org has enough tokens to process the video
    if (newOrgId && canContinue) {
      const orgRef = db.collection('organisations').doc(newOrgId)
      orgData = (await orgRef.get()).data()

      let videoCap: number | undefined = orgData?.subscription?.videoCap
      const yearMonth = new Date().getFullYear() + '-' + new Date().getMonth()
      const videoCount: number = orgData?.videoCounts?.[yearMonth] || 0

      // if the videocap hasn't been stored, infer it from the data we can find

      if (videoCap === undefined) {
        if (orgData?.subscription?.name === 'Free') {
          videoCap = 1
        } else if (orgData?.subscription?.name === 'Grow') {
          videoCap = 4
        } else if (orgData?.subscription?.name === 'Church') {
          videoCap = 10
        } else if (orgData?.subscription?.name === 'Enterprise') {
          videoCap = 0
        } else if (!orgData?.subscription?.name) {
          if (orgData?.source !== 'study-creator') videoCap = 0
        }

        if (!videoCap) {
          console.warn('Cannot infer video cap, assuming 2')
          videoCap = 2
        }

        let subscription = orgData?.subscription
        if (!subscription) {
          subscription = {
            active: true,
            name: 'Free',
            memberCap: 15,
            videoCap: 1,
          }
        } else {
          subscription.videoCap = videoCap
        }

        await orgRef.update({ subscription: subscription })
      }

      if (videoCap !== 0) {
        if (videoCount + 1 > videoCap) {
          canContinue = false

          if (email) {
            await Mailchimp.sendEmailTemplate(
              'Carry',
              'hello@carrybible.com',
              'growth-experiment-error-out-of-tokens',
              devPrefix + "You're out of free studies! 😔 ",
              email,
              email,
            )
          }
        }
      }
    }

    if (canContinue) {
      // if we've not seen the email before, send them a welcome email
      if (email) {
        if (!existingEmail && video.origin === 'website') {
          await Mailchimp.sendEmailTemplate(
            'Carry',
            'hello@carrybible.com',
            'growth-experiment-video-processing',
            devPrefix + 'Welcome to Carry! 👋',
            email,
            email,
          )
        }
      }

      // if we've not processed this video before, query the details from YouTube
      if (!video.youTubeVideoTitle) {
        const videoDetails = await YouTube.getYouTubeInfo(url)
        video = { ...video, ...videoDetails }
      }

      // video does not pass the video filter - throw an error (default error states about the video filter)
      if (!video.youTubeVideoValid) {
        console.log('Video has been filtered out by the video/channel filter')
        throw new Error('Video has been filtered out by the video/channel filter')
      } // we don't have a video to use, so requeue for later processing
      else if (!video.youTubeVideoDirectUrl) {
        if (video.youTubeVideoIsLive) {
          if (email) {
            // email to say there aren't any
            await Mailchimp.sendEmailTemplate(
              'Carry',
              'hello@carrybible.com',
              'growth-experiment-error-no-subtitles',
              devPrefix + 'Your video is delayed ⌛',
              email,
              email,
            )
          }

          await Slack.sendGrowthAlertMessage(
            `Video ${video.videoId} has no usable video using ${video.youTubeVideoUrl} for ${video.email}`,
          )

          // todo queue for re-checking when non-live video is available
        } else {
          // non live video with unusable video

          throw new Error(`Non live video with an unusable video ${url}`)
        }
      } // video passed validation and has usable video
      else {
        // check that we have the required fields to proceed (if we've been parsed an incomplete Video object)
        if (
          !(
            video.youTubeVideoTitle &&
            video.youTubeChannelName &&
            video.youTubeChannelImage &&
            video.youTubeVideoThumbnail
          )
        )
          throw Error(`Cannot find YouTube video title for ${url} and ${email}`)

        const sermonTitle = YouTube.getSermonTitle(video.youTubeVideoTitle, video.youTubeChannelName)
        video.sermonTitle = sermonTitle
        let sermonVerses = YouTube.getBibleVersesFromVideoDetails(
          video.youTubeVideoTitle,
          video.youTubeVideoDescription || '',
        )
        video.sermonVerses = sermonVerses

        let sermonSummary

        // try and find the sermon summary from the video description
        if (video.youTubeVideoDescription) {
          sermonSummary = YouTube.getSermonSummaryFromVideoDescription(
            video.youTubeVideoDescription,
            video.youTubeChannelName,
          )
          video.sermonSummary = sermonSummary
        }

        // if we have not found the semron summary and have video subtitles
        // filter them to the approximate location of the sermon and run through open ai to get the summary
        if (!sermonSummary && (video.sermonSubtitles || video.youTubeVideoSubtitles)) {
          const sermonSubtitles =
            video.sermonSubtitles || YouTube.filterYouTubeSubtitlesToSermon(video.youTubeVideoSubtitles as string)

          if (sermonSubtitles) {
            video.sermonSubtitles = sermonSubtitles
            sermonSummary = await YouTube.getSermonSummaryFromSermonSubtitles(sermonSubtitles)
            video.sermonSummary = sermonSummary
          }
        }

        // no sermon summary - either in a different language or need transcribe
        if (!sermonSummary) {
          if (!video.youTubeVideoSubtitlesUrl) {
            // if we don't have a usuable sermon summary and other languages of subtitles are available - assume the video is in another language
            if (video.youTubeVideoSubtitlesOtherLanguages) {
              console.log(
                'Video has no english subtitles, but some in other languages, sending non-english error email',
              )

              if (email) {
                await Mailchimp.sendEmailTemplate(
                  'Carry',
                  'hello@carrybible.com',
                  'growth-experiment-error-non-english',
                  devPrefix + 'Problem with your study ⚠️',
                  email,
                  email,
                )
              }
            } // if we've already transcribed this and still can't use the result, throw an error
            else if (video.youTubeVideoTranscribeResultsUrl) {
              // we have already submitted this through the transcribe and some other error has been experienced

              throw Error(`Cannot find sermon summary in transcribed job for ${url}`)
            } // send off transcribe
            else {
              console.log('Sending video off to transcribe')
              video.youTubeVideoSentToTranscribe = true

              try {
                const transcribeJob = await axios.post(NEW_TRANSCRIBE_URL, {
                  id: video.videoId,
                  youtube_id: video.youTubeVideoId,
                  dev: isDev,
                })

                if (transcribeJob.status !== 200) {
                  console.log(transcribeJob.statusText)
                  throw new Error(`Could not start transcribe job for ${video.videoId}`)
                }

                if (video.origin === 'dashboard' && newOrgId) {
                  const partialPlan: Partial<CarryPlan> = {
                    author: video.author,
                    name: video.youTubeVideoTitle,
                    state: 'processing',
                  }

                  const planLibraryId = await Plan.pushPlanToOrg(partialPlan, newOrgId, newCampusId)

                  video.planLibraryId = planLibraryId
                  video.planAddedToOrg = true

                  responsePayload = {
                    success: true,
                    planId: video.planLibraryId,
                    videoId: video.videoId as string,
                  }
                }
              } catch (e) {
                console.log(e)
                console.log(`Could not start transcribe job for ${video.videoId} in try caught`)
                throw e
              }
            }
          } // no sermon summary but we have subtitles
          else {
            throw Error(`Some issue with subtitles with ${url}, please investigate manually.`)
          }
        } // can generate the plan from the sermon summary
        else {
          // if we don't have any sermon verses from the title or description, scrub from subtitles
          if (sermonVerses.length === 0 && video.sermonSubtitles) {
            sermonVerses = YouTube.findVersesInSubtitles(video.sermonSubtitles)
            video.sermonVerses = sermonVerses
          }

          //console.info(`Generating a plan from the the sermon summary`)
          const carryPlan: OpenAIPlan = await OpenAI.createCarryPlanFromSermonSummary(
            video.author || CarryUtils.carryUID,
            sermonSummary,
            sermonVerses,
            7,
            sermonTitle,
            video.youTubeVideoThumbnail,
          )

          carryPlan.planYouTubeVideoUrl = video.youTubeVideoUrl
          carryPlan.planVideoId = video.videoId

          video.planName = carryPlan.name
          video.planOpenAiOutput = carryPlan.planOpenAiOutput
          video.planTextVersion = carryPlan.planTextVersion
          video.planVideoVersion = carryPlan.planVideoVersion
          video.planGenerator = carryPlan.planGenerator
          video.planData = JSON.stringify(carryPlan)

          // query create org entities and groups if from the website
          if (video.origin === 'website' && email) {
            let groupId: string | undefined

            // if we've identified an org, query for the related Carry entities
            if (newOrgId) {
              console.info(`Querying required Carry entities for ${newOrgId}`)

              if (!orgData) {
                const orgRef = db.collection('organisations').doc(newOrgId)
                orgData = (await orgRef.get()).data()
              }

              if (!orgData) throw new Error(`Cannot find org ${newOrgId} provided`)

              if (orgData?.mainGroup) groupId = orgData.mainGroup
              if (!newCampusId && orgData?.mainCampus) newCampusId = orgData.mainCampus

              if (!newCampusId) {
                const campuses = (
                  await db.collection('organisations').doc(newOrgId).collection('campuses').limit(1).get()
                ).docs

                if (campuses.length > 0) {
                  newCampusId = campuses[0].id
                } else {
                  newCampusId = await CarryUtils.createCampus(newOrgId, orgData?.name, orgData?.image)
                  console.log(`Created campus ${newCampusId} `)
                }
              }

              if (!groupId) {
                groupId = await CarryUtils.createVideoPlanGroup(
                  'Bible Study Group',
                  newOrgId,
                  newCampusId,
                  video.youTubeChannelImage,
                  offset || 0,
                )
                console.log(`Created group ${groupId}`)
              }
            } // create new org and other carry entities
            else if (video.origin === 'website') {
              if (params?.ref === 'partner-invite') {
                let subscription = {
                  active: true,
                  name: 'Influencer Free',
                  memberCap: 15,
                  videoCap: 0,
                }
                newOrgId = await CarryUtils.createOrg(email, video.youTubeChannelImage, email, undefined, subscription)
              } else {
                newOrgId = await CarryUtils.createOrg(email, video.youTubeChannelImage, email)
              }
              newCampusId = await CarryUtils.createCampus(newOrgId, email, video.youTubeChannelImage)
              groupId = await CarryUtils.createVideoPlanGroup(
                'Bible Study Group',
                newOrgId,
                newCampusId,
                video.youTubeChannelImage,
                offset || 0,
              )
            }

            video.orgId = newOrgId
            video.campusId = newCampusId
            video.groupId = groupId

            if (newOrgId && groupId && newCampusId) {
              console.info(`Setting org to ${newOrgId} campus to ${newCampusId} and group to ${groupId}`)
              const invite = await CarryUtils.createInvite(CarryUtils.carryUID, groupId, newOrgId)

              video.groupInviteId = invite.inviteId
              video.groupInviteUrl = invite.inviteUrl
              video.groupInviteCode = invite.inviteCode
              video.groupInviteQrCodeUrl = invite.inviteQrCodeUrl
            } else {
              throw new Error('Cannot find newly created org, group or campus')
            }
          }

          if (video.origin === 'dashboard' && newOrgId) {
            if (video.planAddedToOrg && video.planLibraryId) {
              await Plan.updatePlanToOrg(video.planLibraryId, carryPlan, newOrgId, newCampusId)
            } else {
              const planLibraryId = await Plan.pushPlanToOrg(carryPlan, newOrgId, newCampusId)
              video.planLibraryId = planLibraryId
              video.planAddedToOrg = true
            }

            responsePayload = {
              success: true,
              planId: video.planLibraryId,
              videoId: video.videoId as string,
            }
          }

          if (!newOrgId) throw new Error('Cannot find org')

          const studyTitle = sermonTitle || carryPlan.name
          const studyTitleFileName = studyTitle
            .toLowerCase()
            .replace(/[^A-Za-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
          video.fileName = `carry-video-${studyTitleFileName}.mp4`

          console.info(`Starting Remotion Render at time: ${video.youTubeVideoTime} with filename ${video.fileName}`)

          let inviteCode = video.groupInviteCode || 'INVITE-CODE-HERE'

          const renderId = await startRemotionRender(
            video.youTubeVideoDirectUrl,
            video.youTubeVideoTime || 0,
            video.youTubeVideoThumbnail,
            studyTitle,
            inviteCode,
            carryPlan.planVideoVersion,
            video.fileName,
          )

          const renderDoc = {
            renderId: renderId,
            videoId: video.videoId,
          }

          // log render id
          await db.collection('renders').doc(renderId).create(renderDoc)

          video.renderId = renderId
          const completeVideo = video as Video

          //add data to mailchimp if from website
          if (video.origin === 'website' && email) {
            const mergeFields = {
              ORGID: newOrgId,
              GROUP_LINK: video.groupInviteUrl,
            }

            const inMailchimp = await MailchimpMarketing.checkMember(MAILCHIMP_AUDIENCE_ID, email)
            console.log(`${email} is ${inMailchimp ? 'in' : 'not in'} mailchimp`)

            if (email) {
              if (!inMailchimp) {
                console.info(`Adding ${email} to Mailchimp subscribers`)
                try {
                  await MailchimpMarketing.subscribeNewMember(MAILCHIMP_AUDIENCE_ID, email, mergeFields, [
                    'Video Submitted',
                  ])
                } catch (e) {
                  if (e instanceof Error) {
                    console.log('Could not add user to mailchimp')
                    console.log(e)
                    errors.push(e.stack || e.message)
                  }
                }
              } else {
                try {
                  await MailchimpMarketing.updateMemberData(MAILCHIMP_AUDIENCE_ID, email, mergeFields)
                } catch (e) {
                  if (e instanceof Error) {
                    console.log('Could not update user data in  mailchimp')
                    console.log(e)
                    errors.push(e.stack || e.message)
                  }
                }
              }
            }
          }

          completeVideo.errors = errors

          responsePayload = {
            success: true,
            planId: video.planLibraryId,
            videoId: video.videoId as string,
          }

          if (errors.length > 0) throw new Error(`${errors[0]} and  ${errors.length - 1} other errors`)
        }
      }
    }
  } catch (e) {
    const catchErrors: string[] = []
    if (e instanceof Error) {
      console.error('Error when trying to process video')
      console.log(e.stack)
      console.log(e.message)
      try {
        if (!isDev) {
          const slackSend = await Slack.sendGrowthAlertMessage(
            `Error ${carryVideoId} using ${url} from ${email} ${e.message}`,
          )
          if (!slackSend) console.warn('Could not send slack message')
        }
      } catch (e) {
        console.log('Could not send slack message')
        if (e instanceof Error) catchErrors.push(e.stack || e.message)
      }
      if (video.origin === 'website' && email) {
        try {
          await Mailchimp.sendEmailTemplate(
            'Carry',
            'hello@carrybible.com',
            'growth-experiment-error-processing',
            devPrefix + 'Problem with your study ⚠️',
            email,
            email,
          )
        } catch (e) {
          console.log('Could not send error email')
          if (e instanceof Error) catchErrors.push(e.stack || e.message)
        }
      }
    }
    if (catchErrors.length > 0) {
      video.errors?.concat(catchErrors) || (video.errors = catchErrors)
      for (const error of catchErrors) console.log(error)
      throw new Error(`There were ${catchErrors.length} errors`)
    }
  } finally {
    await db.collection('videos').doc(carryVideoId).set(video)
  }
  return responsePayload
}

export async function startRemotionRender(
  youTubeVideoDirectUrl: string,
  time: number,
  orgImage: string,
  studyTitle: string,
  groupInviteCode: string,
  days: Array<{ title: string; passage: string }>,
  fileName: string,
) {
  const inputProps: InputProps = {
    videoUrl: youTubeVideoDirectUrl,
    startFrom: time,
    churchLogo: orgImage,
    bibleStudyTitle: studyTitle,
    groupCode: groupInviteCode,
    days: days,
  }
  const res = await renderMediaOnLambda({
    functionName: REMOTION_FUNCTION_NAME,
    codec: 'h264',
    composition: 'Video',
    inputProps,
    envVariables: {
      REMOTION_AWS_ACCESS_KEY_ID: REMOTION_AWS_ACCESS_KEY_ID,
      REMOTION_AWS_SECRET_ACCESS_KEY: REMOTION_AWS_SECRET_ACCESS_KEY,
    },
    region: REMOTION_REGION,
    serveUrl: REMOTION_SERVE_URL,
    webhook: {
      url: REMOTION_WEBHOOK_URL,
      secret: null,
    },
    downloadBehavior: { type: 'download', fileName: fileName },
    maxRetries: 5,
    timeoutInMilliseconds: 120000,
  })
  console.log(`Render started with id: ${res.renderId} `)
  return res.renderId
}

async function isExistingEmail(email: string | undefined) {
  const orgs = (await db.collection('organisations').where('mainEmail', '==', email).get()).docs

  if (orgs.length > 0) return true

  const videos = (await db.collection('videos').where('email', '==', email).get()).docs

  return videos.length > 0
}
