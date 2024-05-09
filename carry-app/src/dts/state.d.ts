import { Channel } from 'stream-chat'
import GroupActions, { GroupActionsType } from '@dts/groupAction'
import { OnboardingState } from '@redux/reducers/onboarding'
import { Score } from '@dts/score'
import { App } from '@dts/app'
import ActionSteps from './actionSteps'
import FollowUp from './followUp'
import { Campaign } from './campaign'
import { Tithing } from './tithing'

declare interface RootState {
  me: App.User & {
    latestMemberActivityPromptModalShow?: number
    latestLeaderPromptShow?: number
    // Map to locally store groups that already shown ShareGroupModal after first daily flow finished
    shareGroupModalShownInGroups: { [groupId: string]: boolean }
    isShowDailyFlowNavigationGuide?: boolean
    isShowAfterStudyHint?: boolean
    isShowMenuHint?: boolean
  }
  campuses: App.Campus[]
  local: {
    enableModalize: boolean
  }
  groups: {
    groups: { [id: string]: App.Group }
    ids: string[]
  }
  group: App.Group & {
    channel: Channel<any>
    channelMembers: any
    directMsgRenderCount: number
    isOwner: boolean
    reloadGroupChatCount: number
    discussionCount: number
    groupActions: {
      prayer: { data: NonNullable<RootState['groupActions']['data']>; unreadCount: number; createdCount: number }
      gratitude: { data: NonNullable<RootState['groupActions']['data']>; unreadCount: number; createdCount: number }
    }
    unreadDirectMessage?: {
      [channelId: string]: number
    }
    unreadGroupMessage: number
    score?: {
      [userId: string]: Score
    }
    hasActionStepFeature?: boolean
    organisation?: App.Organisation // Origin Org values of group
    org?: App.Organisation // data of org fetch from server
  }
  groupActions: {
    type: GroupActionsType
    data?: (GroupActions & {
      messageId?: string
      question?: string
      unread?: boolean
      creatorInfo: {
        userId: string
        image: string
        name: string
      }
    })[]
  }
  actionSteps: {
    data: Array<ActionSteps>
    followUps: Array<FollowUp>
    loadingActionSteps: boolean
    loadingFollowUps: boolean
    activeActionStep?: ActionSteps
    dailyFlowFollowUp?: FollowUp
  }
  reading: {
    translation?: App.Translation
  }
  translations: {
    remote: Array<App.Translation>
    downloaded: { [key: string]: number }
  }
  highlights: {
    data: Array<any>
    updated: number
  }
  screen: {
    loading: boolean
    loadingMessage?: string
    currentScreen?: string
  }
  onboarding: OnboardingState
  settings: {
    populatedPrompt: {
      prayer: {
        text: string
        requestText: string
        chance: number
      }[]
      gratitude: {
        text: string
        requestText: string
        chance: number
      }[]
    }
    currencies: {
      [key: string]: {
        suggestions: number[]
        symbol: string
        value: string
      }
    }
  }
  organisation: {
    campaigns: Array<Campaign>
    tithings: Array<Tithing>
    userCampaign: App.UserCampaign
    orgInfo: App.Organisation

    activeCampaigns: Array<Campaign>
    endedCampaigns: Array<Campaign>
  }
}
