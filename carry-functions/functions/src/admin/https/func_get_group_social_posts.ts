import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getPermissions, isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import { Service } from '../../shared'

const func_get_group_social_posts = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      groupId: string
    },
    context,
  ) => {
    try {
      const uid: any = context.auth?.uid
      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo = authen.user
        const group = (await firestore().doc(`/groups/${payload.groupId}`).get()).data() as Carry.Group

        if (!group) {
          return {
            success: false,
            message: 'Group not found',
          }
        }

        let result: any = {}

        const permissions = await getPermissions({
          permissions: ['view-group'],
          user: userInfo,
          target: {
            type: 'group',
            data: group,
            scope: {
              orgnisationId: userInfo.organisation?.id,
              campusId: userInfo.organisation?.campusId,
            },
          },
        })

        if (!permissions.includes('view-group')) {
          return {
            success: false,
            isAuthen: false,
            message: 'Have no permission to access',
          }
        }

        const plansRef = await firestore()
          .doc(`${collections.GROUPS}/${group.id}`)
          .collection(collections.PLANS)
          .orderBy('updated', 'desc')
          .get()

        const checkDuplicate: { [url: string]: boolean } = {}

        const plans = plansRef.docs
          .map((item) => {
            const planData = item.data() as any
            return {
              ..._.pick(planData, [
                'id',
                'name',
                'duration',
                'state',
                'status',
                'image',
                'pace',
                'description',
                'author',
                'featuredImage',
                'originalId',
                'planVideo',
                'planYouTubeVideoUrl',
              ]),
              updated: planData.updated.toDate().getTime(),
              created: planData.created.toDate().getTime(),
              startDate: planData.startDate.toDate().getTime(),
            }
          })
          .filter((plan) => {
            if (plan.planVideo || plan.planYouTubeVideoUrl) {
              if (!checkDuplicate[plan.planVideo || plan.planYouTubeVideoUrl]) {
                checkDuplicate[plan.planVideo || plan.planYouTubeVideoUrl] = true
                return true
              }
            }
            return false
          })

        result = {
          ...result,
          plans: plans,
          permissions,
        }

        return { success: true, data: result }
      } else {
        return authen
      }
    } catch (error: any) {
      logger.error(error)
      return {
        success: false,
        message: "An unexpected error has occurred, we've let someone know! 🛠️",
      }
    }
  },
)

export default func_get_group_social_posts
