import axios from 'axios'
import * as functions from 'firebase-functions'
import { Service } from '../shared'

const BRANCH_API_KEY: string = functions.config().branch.carry
const LINK_SHORTENER_API_KEY: string = functions.config().branch.link_shortener

const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'

export const generateBranchIOLoginLink = async (loginLink: string, appName: string): Promise<string> => {
  const data = await axios.post('https://api2.branch.io/v1/url', {
    branch_key: functions.config().branch.carry,
    data: {
      $desktop_url: `https://carrybible.com/login?link=${encodeURIComponent(loginLink)}`,
    },
  })

  return data.data.url
}

export async function createBranchDynamicLink(inviteId: string) {
  let data

  try {
    const linkConfig = {
      preview_title: `Tap here to join my group!`,
      preview_text: `Join my group on Carry so we can draw closer to God and build a Bible habit together 🙏`,
      preview_image: 'https://storage.googleapis.com/carry-live.appspot.com/app/invite-preview.png',
    }
    data = await axios.post('https://api2.branch.io/v1/url', {
      branch_key: BRANCH_API_KEY,
      data: {
        $og_title: linkConfig.preview_title,
        $og_description: linkConfig.preview_text,
        $og_image_url: linkConfig.preview_image,
        $desktop_url: isDev
          ? `https://carrybible.com/join-test?i=${inviteId}`
          : `https://carrybible.com/join?i=${inviteId}`,
      },
    })

    return data.data.url
  } catch (e) {
    console.log('error')
    console.log(e)
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
    throw e
  }
}

export async function createBranchShortLink(url: string) {
  const data = await axios.post('https://api2.branch.io/v1/url', {
    branch_key: LINK_SHORTENER_API_KEY,
    data: {
      $fallback_url: url,
      $og_title: 'Download your Carry video',
      $og_description:
        "We've turned your sermon into a study community, so you can continue to engage your members throughout the week",
      $og_type: 'video.other',
      $og_image: 'https://storage.googleapis.com/carry-public/images/web/dlopengraph.jpg',
    },
  })

  return data.data.url
}

export default {
  generateBranchIOLoginLink,
  createBranchDynamicLink,
  createBranchShortLink,
}
