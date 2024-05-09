import { Plan } from '@dts/Plans'
import { RootState } from '@redux/store'
import { loadUserInfos } from '@redux/thunks/members'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { keyBy } from 'lodash'

export const injectUserInfoToPlans = createAsyncThunk(
  'plans/injectUserInfoToPlans',
  async ({ plans }: { plans: Plan[] }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState
    const { membersInfo } = state.members

    const missingUserInfoIds: string[] = []
    const modifiedPlans = plans?.map((plan) => {
      if (!membersInfo[plan.author]) {
        missingUserInfoIds.push(plan.author)
      }
      return {
        ...plan,
        authorInfo: membersInfo[plan.author],
      }
    })

    if (missingUserInfoIds.length > 0) {
      const newMemberInfos = await thunkAPI
        .dispatch(loadUserInfos({ uids: missingUserInfoIds }))
        .unwrap()
      const newMemberInfoMap = keyBy(newMemberInfos, 'uid')
      modifiedPlans.forEach((plan, index) => {
        const userInfo = newMemberInfoMap[plan.author]
        if (!plan.authorInfo && userInfo) {
          modifiedPlans[index].authorInfo = {
            name: userInfo.name!,
            image: userInfo.image!,
          }
        }
      })
    }

    return modifiedPlans
  }
)
