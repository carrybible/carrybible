import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { getDataFromFirestore, getPermissions, isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Utils, Service } from '../../shared'

const func_get_plan = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      campusId?: string | null
      search?: string | null
      tab?: 'plans' | 'templates' | 'featured'
      orders?: [
        {
          key: 'name' | 'length' | 'campus'
          order: 'asc' | 'desc'
        },
      ]
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid
      let result: Carry.Plan[] = []

      const authen = await isAuthen(uid)
      if (authen.success) {
        const userInfo: Carry.User = authen.user
        const permissions = await getPermissions({ user: userInfo })
        if (permissions?.includes('view-plan')) {
          const org = (
            await firestore().doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`).get()
          ).data() as Carry.Organisation

          const campus = (
            await firestore()
              .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
              .collection(collections.CAMPUS)
              .get()
          ).docs.map((x) => x.data() as Carry.Campus)

          let planOfOrg = (
            await firestore()
              .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
              .collection(collections.ORG_PLANS)
              .orderBy('created', 'desc')
              .get()
          ).docs.map((x) => ({ id: x.id, ...x.data() } as Carry.Plan))

          let campusOfUser = Utils.getCampus(userInfo.organisation)

          let flagMaster = false
          if (['admin', 'owner'].includes(userInfo.organisation?.role || '')) {
            campusOfUser = campus.map((x) => x.id)
            flagMaster = true
          }

          const haveTemplates =
            planOfOrg.filter(
              (x) =>
                x.markAsTemplate === true &&
                (flagMaster ? true : !x.campus?.campusId ? true : campusOfUser.includes(x.campus?.campusId || '')),
            )?.length > 0

          if (payload?.tab === 'plans') {
            planOfOrg = planOfOrg.filter((x) =>
              flagMaster
                ? true
                : !x.campus?.campusId
                ? x.markAsTemplate === true || x.shareWithMobile === true
                : campusOfUser.includes(x.campus?.campusId || ''),
            )
          }

          if (payload?.tab === 'templates') {
            planOfOrg = planOfOrg.filter(
              (x) =>
                x.markAsTemplate === true &&
                (flagMaster ? true : !x.campus?.campusId ? true : campusOfUser.includes(x.campus?.campusId || '')),
            )
          }

          if (payload?.tab === 'featured') {
            planOfOrg = planOfOrg.filter(
              (x) =>
                x.shareWithMobile === true &&
                (flagMaster ? true : !x.campus?.campusId ? true : campusOfUser.includes(x.campus?.campusId)),
            )
          }

          if (payload?.search) {
            const searchText = payload?.search ?? ''
            planOfOrg = _.filter(planOfOrg, (item) => {
              return item.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
            })
          }

          if (payload?.campusId) {
            if (payload?.campusId === '-1') {
              planOfOrg = planOfOrg.filter((x) => !x.campus?.campusId)
            } else {
              planOfOrg = planOfOrg.filter((x) => x.campus?.campusId === payload?.campusId)
            }
          }

          const total = planOfOrg?.length ?? 0

          const getAuthorTask: Promise<any>[] = []
          let authorPlanInfo: Carry.User[] = []
          if (total > 0) {
            let authorIds = planOfOrg.map((x) => x.author)
            authorIds = _.compact(_.uniq(authorIds))
            authorIds.forEach((authorId) => {
              getAuthorTask.push(getDataFromFirestore({ type: 'user', data: authorId }))
            })
            authorPlanInfo = (await Promise.all(getAuthorTask))?.map((x) => x as Carry.User)
          }

          result = planOfOrg.map((x) => {
            if (!x.campus) {
              x.campus = {
                campusId: '',
                campusName: '',
              }
            }
            if (!x.authorInfo && x.author) {
              const author = authorPlanInfo.find((item) => item?.uid === x.author)
              if (author) {
                x.authorInfo = {
                  name: author.name ?? org.name,
                  image: author.image ?? org.image ?? '',
                }
              }
            }
            x.campus.campusName = campus.find((q) => q.id === x.campus?.campusId)?.name ?? `${org.name} Org`
            return x
          })

          if (payload.orders && payload.orders?.length > 0) {
            payload?.orders.forEach((element) => {
              if (element.key === 'name') {
                result = result?.sort((n1, n2) => {
                  const item_1 = n1.name ?? ''
                  const item_2 = n2.name ?? ''
                  if (element.order === 'asc') {
                    if (item_1 > item_2) return 1
                    if (item_1 < item_2) return -1
                    return 0
                  } else if (element.order === 'desc') {
                    if (item_1 > item_2) return -1
                    if (item_1 < item_2) return 1
                    return 0
                  }
                  return 0
                })
              }
              if (element.key === 'length') {
                result = result?.sort((n1, n2) => {
                  const item_1 = n1.duration
                  const item_2 = n2.duration
                  if (element.order === 'asc') {
                    if (item_1 > item_2) return 1
                    if (item_1 < item_2) return -1
                    return 1
                  } else if (element.order === 'desc') {
                    if (item_1 > item_2) return -1
                    if (item_1 < item_2) return 1
                    return -1
                  }
                  return 0
                })
              }
              if (element.key === 'campus') {
                result = result?.sort((n1, n2) => {
                  const item_1 = n1.campus?.campusName ?? ''
                  const item_2 = n2.campus?.campusName ?? ''
                  if (element.order === 'asc') {
                    if (item_1 > item_2) return 1
                    if (item_1 < item_2) return -1
                    return 1
                  } else if (element.order === 'desc') {
                    if (item_1 > item_2) return -1
                    if (item_1 < item_2) return 1
                    return -1
                  }
                  return 0
                })
              }
            })
          }

          return { success: true, total: total, data: result, haveTemplate: haveTemplates }
        } else {
          return {
            success: false,
            isAuthen: false,
            message: 'Have no permission to access dashboard!',
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

export default func_get_plan
