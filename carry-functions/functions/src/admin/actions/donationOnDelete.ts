import { firestore, logger } from 'firebase-functions'
import _ from 'lodash'
import { Service } from '../../shared'
import collections from '../../types/collections'

const db = Service.Firebase.firestore()
const campaignRef = (orgId: string, id: string) =>
  db.collection(collections.ORGANISATIONS).doc(orgId).collection(collections.CAMPAIGN).doc(id)
const fundRef = (orgId: string, id: string) =>
  db.collection(collections.ORGANISATIONS).doc(orgId).collection(collections.FUND).doc(id)
export default firestore
  .document(`${collections.ORGANISATIONS}/{orgid}/${collections.DONATES}/{donationId}`)
  .onDelete(async (snap, context) => {
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
            campaign.totalFunds -= donation.amount
            //Have error data
            if (campaign.totalFunds < 0) {
              const allDonationSnaps = await db
                .doc(`/${collections.ORGANISATIONS}/${orgid}`)
                .collection(collections.DONATES)
                .where('campaignId', '==', donation.campaignId)
                .where('id', '!=', donationId)
                .get()
              const allDonations = allDonationSnaps.docs.map((x) => (x.data() as Carry.Donation).amount)
              campaign.totalFunds = _.sum(allDonations)
            }
            updateModel.totalFunds = campaign.totalFunds

            const sampleDonations = await db
              .doc(`/${collections.ORGANISATIONS}/${orgid}`)
              .collection(collections.DONATES)
              .where('campaignId', '==', donation.campaignId)
              .where('uid', '==', donation.uid)
              .where('id', '!=', donationId)
              .get()

            if (sampleDonations.docs.length === 0) {
              const donorIds = campaign.donorIds.filter((x) => x !== donation.uid)
              updateModel.donorIds = donorIds
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
            fund.totalFunds -= donation.amount
            //Have error data
            if (fund.totalFunds < 0) {
              const allDonationSnaps = await db
                .doc(`/${collections.ORGANISATIONS}/${orgid}`)
                .collection(collections.DONATES)
                .where('fundId', '==', donation.fundId)
                .where('id', '!=', donationId)
                .get()
              const allDonations = allDonationSnaps.docs.map((x) => (x.data() as Carry.Donation).amount)
              fund.totalFunds = _.sum(allDonations)
            }
            updateModel.totalFunds = fund.totalFunds

            const sampleDonations = await db
              .doc(`/${collections.ORGANISATIONS}/${orgid}`)
              .collection(collections.DONATES)
              .where('fundId', '==', donation.fundId)
              .where('uid', '==', donation.uid)
              .where('id', '!=', donationId)
              .get()

            if (sampleDonations.docs.length === 0) {
              const donorIds = fund.donorIds.filter((x) => x !== donation.uid)
              updateModel.donorIds = donorIds
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
