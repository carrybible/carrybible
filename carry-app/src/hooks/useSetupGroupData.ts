import { RootState } from '@dts/state'
import { useDrawerStatus } from '@react-navigation/drawer'
import { TYPES } from '@redux/actions'
import Firestore from '@shared/Firestore'
import Smartlook from '@shared/Smartlook'
import StreamIO from '@shared/StreamIO'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import firestore from '@react-native-firebase/firestore'

const useSetupGroupData = () => {
  const dispatch = useDispatch()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const isDrawerOpen = useDrawerStatus() === 'open'

  const [triggerCounter, setTriggerCounter] = React.useState(0)

  useEffect(() => {
    const runSetup = async () => {
      if (!group.id || !group.cid) {
        return
      }

      if (!isDrawerOpen && group.channel) {
        return
      }

      const smartlookData: any = {
        userId: me.uid,
        name: me.name,
        email: me.email,
        currentGroup: group.id,
        groupName: group.name,
      }

      if (group.organisation && group.organisation.id) {
        const org = (await firestore().collection('organisations').doc(group.organisation.id).get()).data() as App.Organisation
        smartlookData.currentOrg = org?.id || null
        smartlookData.orgName = org?.name || null
        dispatch({
          type: TYPES.GROUP.UPDATE,
          payload: {
            org,
          },
        })
      }
      Smartlook.setUserIdentifier(me.uid, smartlookData)

      dispatch({
        type: TYPES.GROUP.LOAD_SCORE,
        payload: {
          groupId: group.id,
        },
      })

      StreamIO.client
        .channel('messaging', group.id)
        .watch()
        .then(async () => {
          const channel = await StreamIO.client.channel('messaging', group.id)
          const members = Object.values(channel?.state?.members ?? {})
          const channelMemberIds = members.map(value => value.user_id)

          // *----- Fix server issue when add member to stream fail
          let isMissingMember = false
          group.members.forEach(memberId => {
            if (!channelMemberIds.includes(memberId)) {
              isMissingMember = true
            }
          })
          if (isMissingMember) {
            if (global.syncedMemberGroupId !== group.id) {
              global.syncedMemberGroupId = group.id
              Firestore.Group.syncMembersFromFirestoreToStream(group.id)
            }
          }
          // *-----

          // In case stream io sync delay comparing to firestore, need to re-fetch again
          if (members.length !== group.members.length) {
            setTimeout(() => {
              setTriggerCounter(triggerCounter + 1)
            }, 2000)
          }
          dispatch({
            type: TYPES.GROUP.UPDATE,
            payload: {
              channel: channel,
              channelMembers: members,
            },
          })
          dispatch({
            type: TYPES.GROUP.SYNC_ACTIONS,
          })
        })
    }
    runSetup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, group?.members, triggerCounter, isDrawerOpen])
}

export default useSetupGroupData
