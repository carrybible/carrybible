import { firestore, logger } from 'firebase-functions'

import { Service } from '../shared'
import collections from '../types/collections'

const db = Service.Firebase.firestore()
const organisationsRef = (id: string) => db.collection('organisations').doc(id)

export default firestore
  .document(`${collections.ORGANISATIONS}/{orgid}/${collections.CAMPUS}/{campusId}`)
  .onCreate(async (snap, context) => {
    const { orgid, campusId } = context.params

    try {
      const orgSnap = await db.doc(`/${collections.ORGANISATIONS}/${orgid}`).get()

      const org = orgSnap.data() as Carry.Organisation
      const campus = snap.data() as Carry.Campus

      if (org && campus && org.id === campus.organisationId) {
        org.totalCampus = (org.totalCampus ?? 0) + 1
        await organisationsRef(orgid).set(
          {
            totalCampus: org.totalCampus,
          },
          { merge: true },
        )
        logger.info(
          `Update total campus of organisations(${org.name}): current ${org.totalCampus} campus; New campus is: ${campus.name}`,
        )
      } else {
        logger.error(
          `Error on update total campus of organisations ${org?.id ?? orgid}, campus:  ${
            campus?.id ?? campusId
          }: Organisation not exist or data inconsidence`
        )
      }

      logger.info(`Done update total campus`)
    } catch (error) {
      logger.error(
        `Error on update total campus of organisations ${orgid}, campus:  ${
          campusId
        }: Organisation not exist or data inconsidence`, error
      )
    }
  })
