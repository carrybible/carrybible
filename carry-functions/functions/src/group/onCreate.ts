import { firestore as firestoreAdmin } from 'firebase-admin'
import { firestore, logger } from 'firebase-functions'

import { genInviteCode } from '../https/func_generate_code'
import { Service, Utils } from '../shared'
import { SPECIAL_ORGANISATION } from '../shared/Constants'
import collections from '../types/collections'
import { DEFAULT_SCORE } from '../types/score'
import { removeUndefinedParams } from '../shared/Utils'

export default firestore.document('/groups/{groupID}').onCreate(async (snap, context) => {
  const { groupID } = context.params
  const group = snap.data() as Carry.Group
  const groupRef = snap.ref

  try {
    /* 
      If owner is found:
      - Create stream channel for Group chat
      - Add owner as moderators
      - Update channel id to group
    */
    if (group.owner !== undefined && group.owner !== '') {
      const streamChannel = Service.Stream.channel('messaging', groupID, {
        image: group.image,
        name: group.name,
        subscription: group.subscription,
        organisation: group.organisation,
        created_by_id: group.owner,
      })
      await streamChannel.create()
      await streamChannel.addModerators([group.owner])
      await streamChannel.sendMessage(
        {
          text: 'Hey! Welcome to the group - checkout this video to learn how to use Carry 🙏 https://youtu.be/cJD-0vWXCUQ',
          user: { id: group.owner },
          silent: true,
          skip_push: true,
        },
        { skip_push: true },
      )
      await groupRef.set({ cid: streamChannel.cid }, { merge: true })
    }

    /* 
      Initialize score collection and total score for group owner
    */
    try {
      await groupRef.collection('score').doc(group.owner).set({
        total: DEFAULT_SCORE,
        updated: firestoreAdmin.FieldValue.serverTimestamp(),
      })
      logger.log(`Initialize score for user ${group.owner} to ${DEFAULT_SCORE}`)
    } catch (e) {
      logger.info('[Error on set default score]', e)
    }

    // Get owner data
    const ownerRef = await Service.Firebase.firestore().doc(`/users/${group.owner}`)
    const ownerDoc = await ownerRef.get()
    const ownerData = ownerDoc.data()

    // Add groupID to Owner data:
    await ownerRef.update({
      groups: firestoreAdmin.FieldValue.arrayUnion(groupID),
    })

    const updateGroupData: {
      organisation?: {
        id: string
        campusId?: string
      }
      fundId?: string
    } = {
      organisation: group.organisation,
      fundId: group.fundId,
    }

    // Get Org and Campus of Owner to Group
    if (ownerData?.organisation?.id && !group.organisation?.id) {
      const groupOrgData: any = { id: ownerData.organisation.id }
      const campusOfUser = Utils.getCampus(ownerData.organisation)
      if (campusOfUser.length > 0) {
        groupOrgData.campusId = campusOfUser[0]
      }
      updateGroupData.organisation = groupOrgData
    }

    if (updateGroupData.organisation?.id) {
      // Get active fund for group
      if (updateGroupData.organisation.campusId) {
        const existFundSnap = await Service.Firebase.firestore()
          .doc(`${collections.ORGANISATIONS}/${updateGroupData.organisation.id}`)
          .collection(collections.FUND)
          .where('campusIds', 'array-contains', updateGroupData.organisation.campusId)
          .get()

        if (existFundSnap && existFundSnap.docs.length > 0) {
          const existFund = existFundSnap.docs[0].data() as Carry.Fund
          updateGroupData.fundId = existFund.id
        }
      }

      // Get ref of Group in ORG
      const groupOrgRef = Service.Firebase.firestore()
        .collection(collections.ORGANISATIONS)
        .doc(updateGroupData.organisation.id)
        .collection(collections.GROUPS)
        .doc(groupID)

      // Update data for both Group in groups/ and organisations/groups/
      await groupRef.set(removeUndefinedParams(updateGroupData), { merge: true })
      await groupOrgRef.set(removeUndefinedParams(updateGroupData), { merge: true })
    }

    // Gen default invite code
    await genInviteCode({ groupId: groupID })
  } catch (e: any) {
    logger.error(`Error creating group ${groupID}:`, e.message)
  }
})
