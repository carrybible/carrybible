import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { genInviteCode } from '../../https/func_generate_code'
import { getPermissions, isAuthen } from '../../shared/Permission'
import collections from '../../types/collections'
import { Service } from '../../shared'

const get_group_details = runWith({
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
          permissions: ['view-group', 'edit-group', 'delete-group', 'invite-member'],
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

        const codes = (
          await firestore()
            .collection(collections.CODES)
            .where('groupId', '==', group.id)
            .orderBy('created', 'desc')
            .get()
        ).docs

        const codeArr: Carry.Codes[] = []
        for (const codeData of codes) {
          const tmp = codeData.data() as Carry.Codes
          codeArr.push(tmp)
        }

        const memberPromise: any[] = []
        group.members.slice(0, 5).forEach((userID) => {
          memberPromise.push(firestore().collection(`users`).doc(userID).get())
        })

        const memberDoc = await Promise.all(memberPromise)
        const members = memberDoc.map((doc) => _.pick(doc.data() as Carry.User, ['uid', 'name', 'image']))

        const plansRef = await firestore()
          .doc(`${collections.GROUPS}/${group.id}`)
          .collection(collections.PLANS)
          .orderBy('status', 'asc')
          .where('status', '!=', 'ended')
          .orderBy('startDate', 'asc')
          .get()
        const plans = plansRef.docs.map((item) => {
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

        if (codeArr && codeArr.length > 0) {
          result = { ...result, inviteCode: codeArr[0].code }
        } else {
          const code = await genInviteCode({ groupId: payload.groupId }, uid)
          if (code.success && code.data?.code) {
            result = { ...result, inviteCode: code.data?.code || '' }
          }
        }

        const userOwner = (await firestore().doc(`/users/${group.owner}`).get()).data() as Carry.User
        if (userOwner) {
          result = {
            ...result,
            leader: _.pick(userOwner, ['uid', 'name', 'image']),
          }
        }

        if (group.organisation?.campusId) {
          const campus = (
            await firestore()
              .collection(`${collections.ORGANISATIONS}/${group.organisation?.id}/${collections.CAMPUS}`)
              .doc(group.organisation?.campusId)
              .get()
          ).data() as Carry.Campus

          if (campus) {
            result = {
              ...result,
              campus: campus,
            }
          }
        }

        result = {
          ...result,
          members: members,
          ..._.pick(group, ['id', 'name', 'image', 'location', 'timeZone', 'organisation']),
          plans,
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

export default get_group_details
