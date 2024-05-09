import { firestore } from 'firebase-functions'
import { sortBy } from 'lodash'

import { Service, WeeklyReviewUtils } from '../shared'
import { Score } from '../types/score'

const db = Service.Firebase.firestore()

const updateHighestGroupScore = async (userId: string) => {
  const userRef = db.collection('users').doc(userId)
  const groups = await db.collection('groups').where('members', 'array-contains', userId).get()
  if (groups.empty) {
    return
  }
  let groupScores = await Promise.all(
    groups.docs.map(async (groupSnap) => {
      const scoreSnap = await db.collection('groups').doc(groupSnap.id).collection('score').doc(userId).get()
      if (!scoreSnap.exists) {
        return null
      }
      const group = groupSnap.data() as Carry.Group
      return {
        groupId: group.id,
        groupName: group.name,
        groupCreated: group.created,
        score: (scoreSnap.data() as Score).total,
      }
    }),
  )
  groupScores = sortBy(
    groupScores.filter((score) => !!score),
    (score) => -score!.score,
  )
  if (groupScores.length === 0) {
    return
  }
  const highestGroupScore = groupScores[0]
  await userRef.set(
    {
      highestScoreGroup: {
        groupId: highestGroupScore!.groupId,
        groupName: highestGroupScore!.groupName,
        groupCreated: highestGroupScore!.groupCreated,
      },
    },
    { merge: true },
  )
}

export default firestore.document('/groups/{groupId}/score/{userId}').onUpdate(async (change, context) => {
  const { groupId, userId } = context.params
  if (!change.after.exists || !change.before.exists) {
    return null
  }
  const pScore = change.before.data() as Score
  const nScore = change.after.data() as Score

  if (pScore.total !== nScore.total) {
    await WeeklyReviewUtils.recordScore({
      groupId,
      userId,
      data: { score: nScore.total },
    })

    await updateHighestGroupScore(userId)
  }
  return true
})
