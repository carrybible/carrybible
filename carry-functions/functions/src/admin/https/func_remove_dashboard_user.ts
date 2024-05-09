import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'

async function removeUserHistory(userInfo: Carry.User) {
  const groups = (
    await firestore().collection(collections.GROUPS).where('members', 'array-contains', userInfo.uid).get()
  ).docs.map((x) => x.data() as Carry.Group)
  const jobs: Promise<any>[] = []
  groups.forEach((group) => {
    if (group.owner === userInfo.uid) {
      group.owner = ''
    }
    jobs.push(
      firestore()
        .doc(`${collections.GROUPS}/${group.id}`)
        .set(
          {
            members: group.members.filter((x) => x !== userInfo.uid),
            owner: group.owner,
          },
          { merge: true },
        ),
    )
  })
  return jobs
}

const func_remove_dashboard_user = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      userId: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid
      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo: Carry.User = authen.user
        const permissions = await getPermissions({ user: userInfo })
        if (
          permissions?.includes('remove-dashboard-campus-user') &&
          (userInfo.organisation?.role === 'admin' || userInfo.organisation?.role === 'owner')
        ) {
          const userRef = firestore().doc(`${collections.USERS}/${payload.userId}`)
          const userData = (await userRef.get()).data() as Carry.User
          if (
            userData.organisation?.id === userInfo.organisation?.id &&
            userData.organisation?.role &&
            userData.organisation?.role !== 'owner'
          ) {
            const actionRemoveUsers = await removeUserHistory(userData)
            actionRemoveUsers.push(userRef.delete())
            await Promise.all(actionRemoveUsers)
            return {
              success: true,
              isAuthen: true,
              message: 'Remove access',
            }
          } else {
            return {
              success: false,
              isAuthen: true,
              message: 'Have no permission to access',
            }
          }
        } else {
          return {
            success: false,
            isAuthen: false,
            message: 'Have no permission to access',
          }
        }
      } else return authen
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_remove_dashboard_user
