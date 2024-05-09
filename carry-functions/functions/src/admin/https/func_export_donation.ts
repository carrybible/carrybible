import { appCheck, firestore } from 'firebase-admin'
import { logger, runWith } from 'firebase-functions'
import * as fs from 'fs-extra'
import * as json2csv from 'json2csv'
import * as os from 'os'
import * as path from 'path'

import * as gcs from '@google-cloud/storage'
import { v4 as uuidv4 } from 'uuid'
import { ROLE_BASE } from '../../shared/Constants'
import { isAuthen } from '../../shared/Permission'
import { Utils, Service } from '../../shared'
import collections from '../../types/collections'
import donationServices from '../services/donationServices'
import _ from 'lodash'
import organsationServices from '../services/organsationServices'
import fundServices from '../services/fundServices'
import campaignServices from '../services/campaignServices'

const func_export_donation = runWith({
  minInstances: Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? 1 : 0,
}).https.onCall(async (payload: Request.DonationExportRequestModel, context) => {
  const uid: string | undefined = context.auth?.uid
  try {
    let result: Response.DonationExport[] = []
    const authen = await isAuthen(uid)
    if (!authen.success) return authen

    const userInfo: Carry.User = authen.user

    if (userInfo.organisation?.role !== ROLE_BASE.OWNER || !userInfo.organisation?.id)
      return {
        success: false,
        isAuthen: true,
        message: 'Permission Denied ',
      }

    const donations = await donationServices.getDonations(
      userInfo.organisation.id,
      payload?.filters?.campaignId,
      payload?.filters?.fundId,
      payload?.filters?.campusId,
    )

    result = await getDataForScopeUser(donations, userInfo)
    const storage = new gcs.Storage()

    const domainPath =
      appCheck().app.options.projectId === 'carry-live' ? 'carry-live.appspot.com' : 'carry-dev.appspot.com'

    const resourcePath = `gs://${domainPath}`
    const bucket = storage.bucket(resourcePath)

    let fields = ['Donor', 'Tithings', 'Campaign', 'Gift Amount', 'Campus', 'Group', 'Date']
    const organisation = await organsationServices.getOrganisationInfo(userInfo.organisation.id)
    let prefixName = organisation.name
    if (payload?.filters?.fundId) {
      const fund = await fundServices.getFundDetail(payload.filters.fundId, organisation.id)
      if (fund?.name) {
        prefixName = fund.name
        fields = ['Donor', 'Tithings', 'Gift Amount', 'Campus', 'Group', 'Date']
      }
    }
    // Set fields if not given

    if (payload?.filters?.campaignId) {
      const campaign = await campaignServices.getCampaignDetail(payload.filters.campaignId, organisation.id)
      if (campaign?.name) {
        prefixName = campaign.name
        fields = ['Donor', 'Campaign', 'Gift Amount', 'Campus', 'Group', 'Date']
      }
    }
    const fileName = `DonationExport/donation_of_${prefixName}_${new Date().getTime()}.csv`
    const tempFilePath = path.join(os.tmpdir(), fileName ?? '')

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
  } catch (error: any) {
    logger.error(error)
    return {
      success: false,
      message: "An unexpected error has occurred, we've let someone know! 🛠️",
    }
  }
})

const getDataForScopeUser = async (donations: Carry.Donation[], userInfo: Carry.User) => {
  if (!userInfo.organisation?.id) {
    return []
  }
  const userDatas: Carry.User[] = []
  const userIds = _.compact(_.uniq(donations.map((x) => x.uid)))

  const queryUserData = firestore().collection(collections.USERS)
  const userPartsSnap = await Promise.all(Utils.queryInSnapCollections(queryUserData, 'uid', userIds))

  const campusRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(userInfo.organisation.id)
    .collection(collections.CAMPUS)
    .get()
  const campaignRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(userInfo.organisation.id)
    .collection(collections.CAMPAIGN)
    .get()
  const fundRef = firestore()
    .collection(collections.ORGANISATIONS)
    .doc(userInfo.organisation.id)
    .collection(collections.FUND)
    .get()
  const [campusDataSnap, campaignDataSnap, fundDataSnap] = await Promise.all([campusRef, campaignRef, fundRef])
  const campusDatas = campusDataSnap.docs.map((x) => x.data() as Carry.Campus)
  const campaignDatas = campaignDataSnap.docs.map((x) => x.data() as Carry.Campaign)
  const fundDatas = fundDataSnap.docs.map((x) => x.data() as Carry.Fund)

  let groups: Carry.Group[] = []
  let allCampusIds: string[] = []
  allCampusIds = _.compact(_.uniq(campusDatas.map((x) => x.id)))

  if (allCampusIds?.length > 0) {
    let groupDocRefs: firestore.QueryDocumentSnapshot[] = []
    const groupPaths = await Promise.all(
      Utils.queryInSnapCollections(firestore().collection(collections.GROUPS), 'organisation.campusId', allCampusIds),
    )
    for (const snap of groupPaths) {
      groupDocRefs = groupDocRefs.concat(snap.docs)
    }
    groups = groupDocRefs.map((x) => x.data() as Carry.Group)
  }

  if (userPartsSnap && userPartsSnap.length > 0) {
    userPartsSnap.forEach((userPart) => {
      if (userPart?.docs?.length > 0) {
        userPart.docs.forEach((item) => {
          const tmpUser = item.data() as Carry.User
          if (tmpUser) {
            userDatas.push(tmpUser)
          }
        })
      }
    })
  }

  let result: Response.DonationExport[] = []
  donations.forEach((donation) => {
    result.push({
      'Gift Amount': donation.amount,
      Campaign: donation.campaignId ? campaignDatas.find((x) => x.id === donation.campaignId)?.name ?? '' : '',
      Tithings: donation.fundId ? fundDatas.find((x) => x.id === donation.fundId)?.name ?? '' : '',
      Campus: donation.campusId ? campusDatas.find((x) => x.id === donation.campusId)?.name ?? '' : '',
      Group: donation.groupId ? groups.find((x) => x.id === donation.groupId)?.name ?? '' : '',
      Donor: donation.uid ? userDatas.find((x) => x.uid === donation.uid)?.name ?? '' : '',
      Date: donation.paidAt.toDate().toISOString(),
    })
  })

  return result
}

export default func_export_donation
