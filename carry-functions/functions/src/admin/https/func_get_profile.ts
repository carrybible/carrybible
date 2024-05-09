import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getDataFromFirestore, getPermissions, isAuthen } from '../../shared/Permission'
import { Service } from '../../shared'

const getProfile = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      uid: string
    },
    context,
  ) => {
    const uid = context.auth?.uid
    try {
      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo = authen.user

        const userProfile = (await getDataFromFirestore({ type: 'user', data: payload.uid })) as Carry.User
        const permissions = await getPermissions({
          permissions: [
            'edit-profile',
            'remove-member',
            'delete-account',
            'view-profile-member',
            'remove-member-from-group',
            'remove-member-from-campus',
            'change-role-to-member',
            'change-role-to-leader',
            'change-role-to-campus-leader',
            'change-role-to-admin',
            'change-role-to-owner',
          ],
          user: userInfo,
          target: {
            type: 'user',
            data: userProfile,
            scope: {
              orgnisationId: userInfo.organisation?.id,
              campusId: userInfo.organisation?.campusId,
            },
          },
        })

        if (!permissions.includes('view-profile-member')) {
          return {
            success: false,
            isAuthen: false,
            message: 'Missing permission to view this Profile',
          }
        }

        const org = await getDataFromFirestore({ type: 'org', data: userInfo.organisation?.id })

        const query = firestore()
          .collection(`groups`)
          .where('members', 'array-contains', userProfile.uid)
          .where('organisation.id', '==', org?.id)
          .orderBy('created', 'desc')

        const groups = (await query.get()).docs

        const groupOfMember: {}[] = []
        for (const group of groups) {
          const groupData = group.data() as Carry.Group
          const tmpData = {
            uid: groupData.id,
            name: groupData.name,
            role: groupData.owner === userProfile.uid ? 'Leader' : 'Member',
            image: groupData.image,
          }
          groupOfMember.push(tmpData)
        }
        let result: {}
        result = _.pick(userProfile, [
          'uid',
          'name',
          'image',
          'email',
          'phoneNumber',
          'state',
          'city',
          'country',
          'region',
          'location',
        ])

        result = {
          ...result,
          orgnisation: {
            id: org.id,
            name: org.name,
            role: userProfile.organisation?.role,
          },
          groups: groupOfMember,
          permissions,
        }
        return { success: true, data: result }
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

export default getProfile
