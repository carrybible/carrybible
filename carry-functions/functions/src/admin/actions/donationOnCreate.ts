import { firestore, logger } from 'firebase-functions'
import { Service } from '../../shared'
import collections from '../../types/collections'

const db = Service.Firebase.firestore()
const campaignRef = (orgId: string, id: string) =>
  db.collection(collections.ORGANISATIONS).doc(orgId).collection(collections.CAMPAIGN).doc(id)
const fundRef = (orgId: string, id: string) =>
  db.collection(collections.ORGANISATIONS).doc(orgId).collection(collections.FUND).doc(id)
export default firestore
  .document(`${collections.ORGANISATIONS}/{orgid}/${collections.DONATES}/{donationId}`)
  .onCreate(async (snap, context) => {
    const { orgid, donationId } = context.params

    try {
      const orgSnap = await db.doc(`/${collections.ORGANISATIONS}/${orgid}`).get()

      const org = orgSnap.data() as Carry.Organisation
      const donation = snap.data() as Carry.Donation

      if (org && donation && org.id === donation.organisationId) {
        if (donation.campaignId) {
          const campaignSnap = await db
            .doc(`/${collections.ORGANISATIONS}/${orgid}`)
            .collection(collections.CAMPAIGN)
            .doc(donation.campaignId)
            .get()
          const campaign = campaignSnap.data() as Carry.Campaign
          if (campaign) {
            const updateModel: any = {}
            campaign.totalFunds += donation.amount
            updateModel.totalFunds = campaign.totalFunds
            if (donation.uid && !campaign.donorIds?.includes(donation.uid)) {
              campaign.donorIds.push(donation.uid)
              updateModel.donorIds = campaign.donorIds
            }

            await campaignRef(orgid, campaign.id).set(
              {
                ...updateModel,
              },
              { merge: true },
            )

            logger.info(
              `Update total funds of campaign (${campaign.name}): ${campaign.totalFunds} ${campaign.currency}`,
            )
          } else {
            logger.error(
              `Update total funds of campaign (${donation.campaignId}): Campaign not exist or data inconsidence`,
            )
          }
        }

        if (donation.fundId) {
          const fundSnap = await db
            .doc(`/${collections.ORGANISATIONS}/${orgid}`)
            .collection(collections.FUND)
            .doc(donation.fundId)
            .get()
          const fund = fundSnap.data() as Carry.Fund
          if (fund) {
            const updateModel: any = {}
            fund.totalFunds += donation.amount
            updateModel.totalFunds = fund.totalFunds
            if (donation.uid && !fund.donorIds?.includes(donation.uid)) {
              fund.donorIds.push(donation.uid)
              updateModel.donorIds = fund.donorIds
            }

            await fundRef(orgid, fund.id).set(
              {
                ...updateModel,
              },
              { merge: true },
            )

            logger.info(`Update total funds of tithing (${fund.name}): ${fund.totalFunds} ${fund.currency}`)
          } else {
            logger.error(`Update total funds of tithing (${donation.fundId}): Tithing not exist or data inconsidence`)
          }
        }
      } else {
        logger.error(`Error on update total funds: invalid data input (campaignId and fundId empty)`)
      }
    } catch (error) {
      logger.error(`Error on update total funds (dontation: ${donationId}): `, error)
    }
  })
