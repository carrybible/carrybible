import { User } from '@dts/User'
import { addMemberInfos } from '@redux/slices/members'
import { createAsyncThunk } from '@reduxjs/toolkit'
import Firebase from '@shared/Firebase'
import { doc, DocumentReference, getDoc } from 'firebase/firestore'

export const loadUserInfos = createAsyncThunk(
  'members/loaderUserInfos',
  async ({ uids }: { uids: string[] }, thunkAPI) => {
    const memberInfos = await Promise.all(
      [...new Set(uids)].map(async (uid) => {
        const memberRef = doc(
          Firebase.firestore,
          Firebase.collections.USERS,
          uid
        ) as DocumentReference<User>

        const userSnap = await getDoc(memberRef)
        return userSnap.data()!
      })
    )
    thunkAPI.dispatch(addMemberInfos(memberInfos))
    return memberInfos
  }
)
