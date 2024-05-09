import { appCheck, firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import * as fs from 'fs-extra'
import * as json2csv from 'json2csv'
import * as os from 'os'
import * as path from 'path'

import * as gcs from '@google-cloud/storage'
import { v4 as uuidv4 } from 'uuid'
import { MESSAGE_RESPONSE, SCOPE, SCOPES } from '../../shared/Constants'
import { isAuthen } from '../../shared/Permission'
import { getUsersBaseOnScope } from '../firestoreHelper'
import { Utils, Service } from '../../shared'
import collections from '../../types/collections'

const export_excel = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(
  async (
    payload: {
      scope: string
      scopeId: string
    },
    context,
  ) => {
    try {
      const uid = context.auth?.uid
      const result: Response.MemberExport[] = []
      const members: Carry.User[] = []
      const scopeId = payload?.scopeId
      const scope = payload?.scope

      if (!scopeId || !scope || !SCOPES.includes(scope)) return { success: false, error: 'scope not provide' }

      const authen = await isAuthen(uid)
      if (authen.success) {
        if (!authen.permissions?.includes('view-dashboard-members'))
          return { success: false, isAuthen: false, message: MESSAGE_RESPONSE.UAUTHEN }
        const userInfo = (await firestore().doc(`/users/${uid}`).get()).data() as Carry.User
        let trackTime = new Date().getTime()
        const users = await getUsersBaseOnScope(scope, scopeId, authen.user)
        logger.info('getUsersBaseOnScope time', { scope, scopeId }, new Date().getTime() - trackTime)
        users.forEach((element) => {
          members.push(element)
        })

        const campusRef = firestore()
          .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
          .collection(collections.CAMPUS)
          .get()

        trackTime = new Date().getTime()
        const campusData = (await campusRef).docs.map((x) => x.data() as Carry.Campus)
        logger.info('get campusData time', { scope, scopeId }, new Date().getTime() - trackTime)
        const masterRoles = ['admin', 'owner']
        for (const member of members) {
          const tmpData: Response.MemberExport = {
            'User Name': member.name ?? member.email,
            'User Location': `${(member?.city ?? '') + (member?.city ? ',' : '')}${member?.country ?? ''}`,
            'Email Address': member.email,
            'Phone Number': member.phone,
            Campus: masterRoles.includes(member.organisation?.role ?? '')
              ? campusData.map((x) => x.name)?.join(', ') ?? ''
              : campusData
                  .filter((x) => Utils.getCampus(member.organisation)?.includes(x.id))
                  .map((x) => x.name)
                  ?.join(', ') ?? '',
            'Current Daily Streak': member.currentStreak,
            'Total Prayers': member.totalPrayer ?? 0,
            'Total Gratitude Requests': member.totalPraise ?? 0,
            'Current Activity Status': member.visibility,
            'Join Date': new Date((member.created?.seconds || 0) * 1000).toISOString(),
          }
          result.push(tmpData)
        }

        const storage = new gcs.Storage()

        const domainPath =
          appCheck().app.options.projectId === 'carry-live' ? 'carry-live.appspot.com' : 'carry-dev.appspot.com'

        const resourcePath = `gs://${domainPath}`
        const bucket = storage.bucket(resourcePath)

        trackTime = new Date().getTime()
        const fileName = await generateFileName(scope, scopeId, userInfo.organisation?.campusId)
        logger.info('get fileName time', { scope, scopeId }, new Date().getTime() - trackTime)
        const tempFilePath = path.join(os.tmpdir(), fileName ?? '')

        // Set fields if not given
        const fields = [
          'User Name',
          'User Location',
          'Email Address',
          'Phone Number',
          'Campus',
          'Current Daily Streak',
          'Total Prayers',
          'Total Gratitude Requests',
          'Current Activity Status',
          'Join Date',
        ]

        // Write data to client
        const parser = new json2csv.Parser({ fields, delimiter: ',' })

        const csvFileMemory = await parser.parse(result)

        await fs.outputFile(tempFilePath, csvFileMemory)

        const csvUploaded = await bucket.upload(tempFilePath, {
          destination: fileName,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: uuidv4(),
            },
          },
        })

        const dowloadLink =
          `https://firebasestorage.googleapis.com/v0/b/${domainPath}/o/` +
          csvUploaded[0].id +
          '?alt=media&token=' +
          csvUploaded[0]?.metadata?.metadata?.firebaseStorageDownloadTokens

        return { success: true, data: { urlDownload: dowloadLink } }
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

async function generateFileName(scope: string, scopeId: string, orgId: string = '') {
  switch (scope) {
    case SCOPE.ORGANISATION:
      const org = (await firestore().doc(`/organisations/${scopeId}`).get()).data() as Carry.Organisation
      return `MembersExport/member_of_${org.name}_${new Date().getTime()}.csv`
    case SCOPE.CAMPUS:
      const campusData = (
        await firestore()
          .doc(`${collections.ORGANISATIONS}/${orgId}`)
          .collection(collections.CAMPUS)
          .where('id', '==', scopeId)
          .get()
      ).docs.map((element) => {
        return element.data() as Carry.Campus
      })

      return `MembersExport/member_of_${campusData.length > 0 ? campusData[0].name : ''}_${new Date().getTime()}.csv`
    case SCOPE.GROUP:
      const group = (await firestore().doc(`/groups/${scopeId}`).get()).data() as Carry.Group
      return `MembersExport/member_of_${group.name}_${new Date().getTime()}.csv`
    default:
      return ''
  }
}

export default export_excel
