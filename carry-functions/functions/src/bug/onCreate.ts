import { firestore, logger, config } from 'firebase-functions'
import { Octokit } from '@octokit/core'

export type UserResponse = {
  id: string
  message: string

  uid: string
  name: string
  email: string
  groupId: string
  groupName: string

  campusIdOfGroup: string
  orgIdOfGroup: string

  campusIds: string[]
  orgId: string
  orgName: string

  appName: string
  appVersion: string
  appPlatform: string
  deviceVersion: string | number

  trigger?: boolean // To trigger event create again on github
}

export default firestore.document('/bugs/{bugId}').onCreate(async (snap, context) => {
  const { bugId } = context.params
  const bug = snap.data() as UserResponse

  try {
    await handleFeedback(bug, 'bug')
  } catch (e: any) {
    logger.error(`Error creating github issue for bug ${bugId}:`, e.message)
  }
})

export const handleFeedback = async (bug: UserResponse, responseType: 'bug' | 'feedback') => {
  const octokit = new Octokit({ auth: config().github.key })
  return await octokit.request('POST /repos/carrybible/carry-issues/issues', {
    owner: 'carrybible',
    repo: 'carry-issues',
    title: `[${responseType === 'bug' ? 'Bug' : 'Feedback'}] ${bug.id}`,
    body: `### Message\n${bug.message}\n\n### App version\n**App name**: ${bug.appName}\n**OS**: ${bug.appPlatform} ${
      bug.deviceVersion
    }\n**App Version**: ${bug.appVersion}\n\n### User's information\n**Name**: ${bug.name}\n**UID**: ${
      bug.uid
    }\n**Email**: ${bug.email}\n\n**Group**: ${bug.groupName} - ${bug.groupId}\n**Org of Group**: ${
      bug.orgIdOfGroup
    }\n**Campus of Group**: ${bug.campusIdOfGroup}\n\n**User Org**: ${bug.orgName} - ${
      bug.orgId
    }\n**User Campuses**: ${JSON.stringify(bug.campusIds)}`,
    assignees: ['datvudang'],
    labels: ['app', responseType],
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
}
