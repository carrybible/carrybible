import { logger, runWith } from 'firebase-functions'
import _ from 'lodash'
import { isAuthen } from '../../shared/Permission'
import { firestore } from 'firebase-admin'
import collections from '../../types/collections'
import { Service } from '../../shared'
import { resError, resSuccess } from '../../shared/Utils'

const func_update_organisation_details = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      organisationId: string
      name: string
      image?: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid

      const authen = await isAuthen(uid)
      if (authen.success && (authen.user?.organisation?.role === 'owner' || authen.user?.isGM)) {
        if (payload?.organisationId && authen.user?.uid) {
          const orgRef = await firestore().collection(collections.ORGANISATIONS).doc(payload.organisationId)
          const orgDoc = await orgRef.get()
          const orgData = orgDoc.data() as Carry.Organisation
          if (orgData?.owners?.includes(authen.user?.uid) || authen.user?.isGM) {
            await orgRef.set({ name: payload.name, image: payload?.image || '' }, { merge: true })
          } else {
            return resError('Have no permission to update')
          }
        }
        return resSuccess('Update details success')
      } else {
        return resError('Have no permission to access')
      }
    } catch (error: any) {
      logger.error(error)
      return resError("An unexpected error has occurred, we've let someone know! 🛠️")
    }
  },
)

export default func_update_organisation_details
