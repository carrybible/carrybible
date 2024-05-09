import { firestore } from 'firebase-admin'
import _ from 'lodash'
import { SCOPE } from '../shared/Constants'
import Utils from '../shared/Utils'
import collections from '../types/collections'

export const getUsersBaseOnScope = async function (
  scope: string,
  scopeId: string,
  user: Carry.User | undefined = undefined,
) {
  switch (scope) {
    case SCOPE.ORGANISATION:
      const result: Carry.User[] = (
        await firestore().collection(collections.USERS).where('organisation.id', '==', scopeId).get()
      ).docs.map((item) => {
        return item.data() as Carry.User
      })
      return result
    case SCOPE.CAMPUS:
      let resultCampus: Carry.User[] = []
      const jobs: Promise<firestore.QuerySnapshot>[] = []
      Utils.getCampus(user?.organisation)?.forEach((campusId) => {
        jobs.push(firestore().collection(collections.USERS).where('organisation.campusId', '==', campusId).get())
        jobs.push(
          firestore().collection(collections.USERS).where('organisation.campusIds', 'array-contains', campusId).get(),
        )
      })
      const queries = await Promise.all(jobs)
      for (const snap of queries) {
        resultCampus = resultCampus.concat(snap?.docs?.map((x) => x.data() as Carry.User))
      }
      return _.uniqBy(resultCampus, "id")
    case SCOPE.GROUP:
      const group = (await firestore().doc(`groups/${scopeId}`).get()).data() as Carry.Group
      if (group) {
        const memberJobs: Promise<firestore.DocumentData>[] = []
        group.members.forEach((uid) => {
          memberJobs.push(firestore().collection(collections.USERS).doc(uid).get())
        })
        const memberDocs = await Promise.all(memberJobs)
        return memberDocs.map((doc) => doc.data())
      } else {
        return []
      }
    case 'groups-owner':
      const groupOwner = await firestore().collection(`groups`).where('owner', '==', user?.uid).get()
      let userInGroupsIds: string[] = []
      groupOwner.forEach((groupDoc) => {
        const groupData = groupDoc.data() as Carry.Group
        userInGroupsIds = [...userInGroupsIds, ...groupData.members]
      })
      if (groupOwner && groupOwner.docs.length > 0 && userInGroupsIds) {
        const userRefs = (await firestore().collection(collections.USERS).get()).docs
        const userDatas = userRefs
          .filter((x) => {
            return userInGroupsIds.includes((x.data() as Carry.User).uid)
          })
          .map((x) => x.data() as Carry.User)
        return userDatas
      } else {
        return []
      }
    default:
      return []
  }
}

export default { getUsersBaseOnScope }
