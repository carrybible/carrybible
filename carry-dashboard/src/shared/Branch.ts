import Config from '@shared/Config'
import Firebase from '@shared/Firebase'
import { getValue } from 'firebase/remote-config'
import axios from 'axios'

const createBranchDynamicLink = async (
  params: {
    uid: string
    groupId: string
    orgId?: string
  },
  inviteId: string
): Promise<string> => {
  const linkConfig = JSON.parse(
    getValue(Firebase.remoteConfig, 'invitation_link').asString()
  ) as {
    preview_title: string
    preview_text: string
    preview_image: string
  }
  const data = await axios.post('https://api2.branch.io/v1/url', {
    branch_key: Config.BRANCH_KEY,
    data: {
      $og_title: linkConfig.preview_title,
      $og_description: linkConfig.preview_text,
      $og_image_url: linkConfig.preview_image,
      $desktop_url: `https://carrybible.com/join?i=${inviteId}`,
    },
  })

  return data.data.url
}

const Branch = {
  createBranchDynamicLink,
}

export default Branch
