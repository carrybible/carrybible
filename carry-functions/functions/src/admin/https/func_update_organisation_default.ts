import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'

const func_update_organisation_default = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      organisationId: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success && authen.user?.isGM) {
        if (payload?.organisationId && authen.user?.uid) {
          const userRef = firestore().collection(collections.USERS).doc(authen.user?.uid)
          await userRef.set({ defaultGMAccess: payload.organisationId }, { merge: true })
        }
        return {
          success: true,
          isAuthen: true,
          message: 'Update default access success',
        }
      } else {
        return {
          success: false,
          isAuthen: false,
          message: 'Have no permission to access',
        }
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

export default func_update_organisation_default
