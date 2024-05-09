import { Timestamp } from '@google-cloud/firestore'
import { firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import _, { pick } from 'lodash'
import { Service, Utils } from '../../shared'
import { getDataFromFirestore, getPermissions, isAuthen } from '../../shared/Permission'
import stringUtils from '../../shared/stringUtils'
import collections from '../../types/collections'

const func_get_groups = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      search?: string | null
      groupBy?: string | null
      page?: number
      limit?: number
      memberId?: string
      orders?: [
        {
          key: 'name' | 'leader' | 'member'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    try {
      const uid: string | undefined = context.auth?.uid
      const authen = await isAuthen(uid)
      const limitData = payload?.limit ?? 100
      const pageData = payload?.page ?? 1
      if (authen.success) {
        const userInfo = authen.user
        const permissionsOfUser = await getPermissions({ user: userInfo })
        if (!permissionsOfUser.includes('view-dashboard-groups')) return
        const organisationId = userInfo?.organisation?.id
        let groupDocRefs: firestore.QueryDocumentSnapshot[] = []

        const campus = (
          await firestore()
            .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
            .collection(collections.CAMPUS)
            .get()
        ).docs.map((x) => x.data() as Carry.Campus)

        let campusOfUser = Utils.getCampus(userInfo.organisation)

        if (userInfo.organisation?.role === 'admin' || userInfo.organisation?.role === 'owner') {
          campusOfUser = campus.map((x) => x.id)
        }

        let query = firestore().collection(collections.GROUPS).where('organisation.id', '==', organisationId)
        if (payload.memberId) {
          query = query.where('members', 'array-contains', payload.memberId)
        }
        switch (userInfo.organisation?.role) {
          case 'campus-leader':
          case 'campus-user':
            const queries = await Promise.all(
              Utils.queryInSnapCollections(query, 'organisation.campusId', campusOfUser),
            )
            for (const snap of queries) {
              groupDocRefs = groupDocRefs.concat(snap.docs)
            }
            break
          case 'leader':
            query = query.where('owner', '==', userInfo.uid)
            groupDocRefs = groupDocRefs.concat((await query.get()).docs)
            break
          default:
            groupDocRefs = groupDocRefs.concat((await query.get()).docs)
            break
        }
        const userCampus = campus.filter((x) => campusOfUser.includes(x.id))
        let groupDocs = groupDocRefs.map((item) => {
          return item.data() as Carry.Group
        })

        groupDocs = groupDocs.sort((a, b) => {
          try {
            return (
              (b.created
                ? (typeof b.created === 'string' ? Timestamp.fromDate(new Date(b.created as string)) : b.created)
                    ?.toDate()
                    ?.getTime() ?? -1
                : -1) -
              (a.created
                ? (typeof a.created === 'string' ? Timestamp.fromDate(new Date(a.created as string)) : a.created)
                    ?.toDate()
                    ?.getTime() ?? -1
                : -1)
            )
          } catch (error) {
            return -1
          }
        })

        if (payload?.orders && payload?.orders?.length > 0) {
          payload?.orders.forEach((element) => {
            if (element.key === 'name') {
              groupDocs = groupDocs?.sort((n1, n2) => {
                const item1 = n1.name ?? ''
                const item2 = n2.name ?? ''
                return (
                  (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
                  (element.order === 'asc' ? 1 : element.order === 'desc' ? -1 : 0)
                )
              })
            }
            if (element.key === 'member') {
              groupDocs = groupDocs?.sort((n1, n2) => {
                const item1 = n1.memberCount ?? ''
                const item2 = n2.memberCount ?? ''
                return (
                  (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
                  (element.order === 'asc' ? 1 : element.order === 'desc' ? -1 : 0)
                )
              })
            }
          })
        }

        if (!stringUtils.isNullOrEmpty(payload?.search)) {
          groupDocs = groupDocs.filter(
            (x) => x.name?.toLocaleLowerCase()?.includes(payload?.search?.toLocaleLowerCase() || '') ?? false,
          )
        }
        const getLeaderTask: Promise<any>[] = []
        let groupLeaders = groupDocs.map((x) => x.owner)
        groupLeaders = _.compact(_.uniq(groupLeaders))

        groupLeaders.forEach((leaderId) => {
          getLeaderTask.push(getDataFromFirestore({ type: 'user', data: leaderId }))
        })
        const groupLeaderUsers: Carry.User[] = (await Promise.all(getLeaderTask))?.map((x) => x as Carry.User)

        let groups: any = []
        for (const groupData of groupDocs) {
          let leaderData: Carry.User | undefined = undefined

          if (groupData.owner) {
            leaderData = groupLeaderUsers?.find((x) => x?.uid === groupData.owner)
          }
          const permissions = await getPermissions({
            permissions: ['view-group', 'edit-group', 'delete-group'],
            user: userInfo,
            target: {
              type: 'group',
              data: groupData,
              scope: {
                orgnisationId: userInfo.organisation?.id,
                campusId: groupData.organisation?.campusId,
              },
            },
          })
          if (permissions.includes('view-group')) {
            groups.push({
              ...groupData,
              permissions,
              campus: userCampus.find((x) => x.id === groupData.organisation?.campusId),
              leader: leaderData && pick(leaderData, ['uid', 'name', 'image']),
            })
          }
        }

        if (payload?.orders && payload?.orders?.length > 0) {
          payload?.orders.forEach((element) => {
            if (element.key === 'leader') {
              groups = groups?.sort((n1: any, n2: any) => {
                const item1 = n1.leader?.name ?? ''
                const item2 = n2.leader?.name ?? ''
                return (
                  (item1 > item2 ? 1 : item1 === item2 ? 0 : -1) *
                  (element.order === 'asc' ? 1 : element.order === 'desc' ? -1 : 0)
                )
              })
            }
          })
        }

        groups = _(groups)
          .drop((pageData - 1) * limitData)
          .take(limitData)
          .value()
        return {
          success: true,
          data: groupDataByType(groups, payload?.groupBy || ''),
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

const groupDataByType = (groups: any, groupBy: string) => {
  if (groupBy === 'campus') {
    const data = _.groupBy(groups, (value) => value.campus?.name || 'Remote')
    return Object.keys(data).map((key) => ({ groupByValue: key, data: data[key] }))
  }

  if (['city', 'state', 'region', 'country'].includes(groupBy)) {
    const data = _.groupBy(groups, (value) => (value.campus?.[groupBy] || value.campus ? 'Other places' : 'Remote'))
    return Object.keys(data).map((key) => ({ groupByValue: key, data: data[key] }))
  }

  return { groupByValue: 'Unknown', data: groups }
}

export default func_get_groups
