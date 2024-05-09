import axios, { AxiosError } from 'axios'

const webflowAccessToken = ''
const webflowStudyCollectionId = ''
const webflowApiBaseUrl = 'https://api.webflow.com/collections/'
const webflowNewItemUrl =
  webflowApiBaseUrl + webflowStudyCollectionId + '/items?live=true&access_token=' + webflowAccessToken

export interface WebflowStudy {
  slug: string
  studyName: string
  groupName: string
  videoUrl: string
  day1Text: string
  day2Text: string
  day3Text: string
  day4Text: string
  day5Text: string
  day6Text: string
  day7Text: string
  inviteLink: string
  inviteCode: string
  videoId: string
  dev: boolean
  email: string
}

async function addStudyToWebflow(study: WebflowStudy) {
  let webflowStudy = {
    _archived: false,
    _draft: false,
    slug: study.slug,
    name: study.studyName,
    'group-name': study.groupName,
    'video-url': study.videoUrl,
    'day-1-text': study.day1Text,
    'day-2-text': study.day2Text,
    'day-3-text': study.day3Text,
    'day-4-text': study.day4Text,
    'day-5-text': study.day5Text,
    'day-6-text': study.day6Text,
    'day-7-text': study.day7Text,
    'invite-link': study.inviteLink,
    'invite-code': study.inviteCode,
    'video-id': study.videoId,
    dev: study.dev,
    email: study.email,
  }

  try {
    const response = await axios.post(webflowNewItemUrl, { fields: webflowStudy })

    if (response.status >= 200 && response.status < 300) {
      return true
    } else {
      console.log(response)
      throw new Error('Cannot create study on webflow')
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      console.log(e.response?.data)
    } else if (e instanceof Error) {
      console.log(e.stack)
    }
    throw new Error('Cannot create study on webflow')
  }
}

export default {
  addStudyToWebflow,
}
