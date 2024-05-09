import axios from 'axios'
import * as functions from 'firebase-functions'

const BRANCH_API_KEY = functions.config().branch.carry
const LINK_SHORTENER_API_KEY = functions.config().branch.link_shortener

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
  const linkConfig = {
    preview_title: `Tap here to join my group!`,
    preview_text: `Join my group on Carry so we can draw closer to God and build a Bible habit together 🙏`,
    preview_image: 'https://storage.googleapis.com/carry-live.appspot.com/app/invite-preview.png',
  }
  const data = await axios.post('https://api2.branch.io/v1/url', {
    branch_key: BRANCH_API_KEY,
    data: {
      $og_title: linkConfig.preview_title,
      $og_description: linkConfig.preview_text,
      $og_image_url: linkConfig.preview_image,
      $desktop_url: `https://carrybible.com/join?i=${inviteId}`,
    },
  })

  return data.data.url
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
