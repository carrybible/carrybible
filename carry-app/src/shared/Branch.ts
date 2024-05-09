import branch from 'react-native-branch'
import { getConfig } from './Utils'

const createBranchDynamicLink = async (params: Record<string, string>, inviteId: string): Promise<string> => {
  const linkConfig = getConfig('invitation_link')

  const branchUniversalObject = await branch.createBranchUniversalObject('carry.bible', {
    locallyIndex: true,
    title: linkConfig.preview_title,
    contentDescription: linkConfig.preview_text,
    contentImageUrl: linkConfig.preview_image,
    contentMetadata: {
      customMetadata: params,
    },
  })

  const linkProperties = {
    feature: 'share',
  }

  const { url } = await branchUniversalObject.generateShortUrl(linkProperties, {
    $desktop_url: `https://carrybible.com/join?i=${inviteId}`,
    ...params,
  })

  return url
}

const createOpenPrayerShareLink = async (groupId: string): Promise<string> => {
  const branchUniversalObject = await branch.createBranchUniversalObject('carry.bible', {
    locallyIndex: true,
    title: 'Open prayer',
    contentDescription: `Open prayer for group ${groupId}`,
  })

  const linkProperties = {
    feature: 'share',
  }

  const { url } = await branchUniversalObject.generateShortUrl(linkProperties, {
    $desktop_url: `https://carrybible.com/prayer?groupId=${groupId}`,
  })

  return url
}

export default {
  createBranchDynamicLink,
  createOpenPrayerShareLink,
}
