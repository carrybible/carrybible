import { logger, runWith } from 'firebase-functions'
import { firestore } from 'firebase-admin'
import { isAuthen } from '../../shared/Permission'
import { handleYouTube } from '../../video/func_process_video'
import { Service } from '../../shared'

const func_generate_plan_from_sermon = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: { youTubeVideoUrl: string }, context) => {
  try {
    const uid = context.auth?.uid
    const authen = await isAuthen(uid)
    if (authen.success) {
      const user = authen.user
      const orgId = user.organisation?.id

      if (!orgId) throw new Error(`Cannot find Org for user ${uid}`)

      const orgRef = firestore().collection('organisations').doc(orgId)
      const orgData = (await orgRef.get()).data()

      if (!orgData) throw new Error(`Cannot find org data for org ${orgId}`)

      // url: string,
      // origin: 'website' | 'dashboard',
      // email?: string,
      // offset?: number,
      // params?: any,
      // orgId?: string,
      // campusId?: string,
      // existingVideo?: Partial<Video>

      const youTubeSuccess = await handleYouTube(
        payload.youTubeVideoUrl,
        'dashboard',
        user.email,
        undefined,
        undefined,
        orgId,
        user.organisation?.campusId,
        uid,
      )
      return {
        success: youTubeSuccess.success,
        data: { planId: youTubeSuccess.planId, videoId: youTubeSuccess.videoId },
      }
    } else return authen
  } catch (error: any) {
    logger.error(error, payload)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
      error: error?.message || '',
    }
  }
})

export default func_generate_plan_from_sermon
