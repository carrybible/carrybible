import { https, logger } from 'firebase-functions'
import { Service } from '../shared'
import { firestore } from 'firebase-admin'

const db = Service.Firebase.firestore()

const genSharedPlanId = (uid: string, planId: string) => `${uid}_${planId}`

const sharePlanToOrg = https.onCall(async ({ planId, orgId }: { planId: string; orgId: string }, context) => {
  const uid = context.auth?.uid
  if (!uid) {
    logger.error('Missing uid')
    return {
      success: false,
    }
  }
  if (!planId || !orgId) {
    logger.error('Missing parameters', {
      planId,
      orgId,
      uid,
    })
    return {
      success: false,
    }
  }

  try {
    logger.info(`Sharing user plan to org`, {
      planId,
      orgId,
      uid,
    })
    const sharedPlanRef = db
      .collection('organisations')
      .doc(orgId)
      .collection('sharedPlans')
      .doc(genSharedPlanId(uid, planId))

    const userPlanRef = db.collection('users').doc(uid).collection('plans').doc(planId)

    await sharedPlanRef.set({
      userId: uid,
      planId,
      created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      data: userPlanRef,
    })

    await userPlanRef.set(
      {
        sharedOrg: firestore.FieldValue.arrayUnion(orgId),
      },
      { merge: true },
    )

    return {
      success: true,
    }
  } catch (e) {
    logger.error(`Failed to add shared plan to organisation`, e)
    return {
      success: false,
    }
  }
})

export default sharePlanToOrg
