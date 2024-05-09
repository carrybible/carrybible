import { https } from 'firebase-functions'
import { differenceInDays } from 'date-fns'

import { Service } from '../shared'

const db = Service.Firebase.firestore()

type LeaderPromptSetting = {
  tip?: { [dayKey: string]: { content: string; title: string } }
  video?: { [dayKey: string]: string }
}

const getLeaderPromptKey = (days: number) => {
  return `day_${days}`
}

const getLeaderPromptSetting = async (): Promise<LeaderPromptSetting | null> => {
  const settingSnap = await db.collection('settings').doc('leaderPrompt').get()
  if (!settingSnap.exists) {
    return null
  }
  return settingSnap.data() as LeaderPromptSetting
}

const failedResponse = (message: string) => ({
  success: false,
  response: {
    message,
  },
})

const successResponse = ({
  showPrompt,
  tip,
  video,
}: {
  showPrompt: boolean
  tip?: { title: string; content: string }
  video?: string
}) => ({
  success: true,
  response: {
    showPrompt,
    tip,
    video,
  },
})

const func_get_leader_prompts = https.onCall(async (_, context) => {
  const now = Date.now()
  const userId = context.auth?.uid
  if (!userId) {
    return failedResponse(`Can not authenticated`)
  }

  const leaderPromptSetting = await getLeaderPromptSetting()
  if (!leaderPromptSetting) {
    return failedResponse(`Can not found any leader prompt setting`)
  }

  const userRef = db.collection('users').doc(userId)
  const userSnap = await userRef.get()
  const user = userSnap.data() as Carry.User
  let group: Carry.Group | undefined

  if (user.firstCreatedGroupId) {
    const groupSnap = await db.collection('groups').doc(user.firstCreatedGroupId).get()
    group = groupSnap.data() as Carry.Group | undefined
  }

  if (!group) {
    const groups = await db.collection('groups').where('owner', '==', userId).orderBy('created', 'asc').limit(1).get()
    if (groups.empty) {
      return successResponse({ showPrompt: false })
    }
    const groupSnap = groups.docs[0]
    group = groupSnap.data() as Carry.Group
    await userRef.set({ firstCreatedGroupId: groupSnap.id }, { merge: true })
  }
  const groupCreatedTime = group.created

  const daysFromCreated = differenceInDays(now, (groupCreatedTime.seconds || 0) * 1000)
  const leaderPromptKey = getLeaderPromptKey(daysFromCreated)

  const tip = leaderPromptSetting.tip?.[leaderPromptKey]
  const video = leaderPromptSetting.video?.[leaderPromptKey]

  if (!tip && !video) {
    return successResponse({ showPrompt: false })
  }
  return successResponse({ showPrompt: true, tip, video })
})

export default func_get_leader_prompts
