import { Plan } from '@dts/Plans'
import { RootState } from '@redux/store'
import { injectUserInfoToPlans } from '@redux/thunks/plan'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type PlanPage = {
  plans: string[] | undefined
  planInfos: Record<string, Plan>
}

const initialState: PlanPage = {
  plans: undefined,
  planInfos: {},
}

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    updatePlans(state, { payload: plans }: PayloadAction<Plan[]>) {
      state.plans = plans.map((plan) => plan.id)
    },
    updatePlanInfos(state, { payload }: PayloadAction<Plan>) {
      state.planInfos[payload.id] = payload
    },
  },
  extraReducers(builder) {
    builder.addCase(
      injectUserInfoToPlans.fulfilled,
      (state, { payload: plans }) => {
        plans.forEach((plan) => {
          state.planInfos[plan.id] = plan
        })
      }
    )
  },
})

export const plansSelector = (state: RootState) => {
  const { plans, planInfos } = state.plan
  return plans?.map((planId) => planInfos[planId])
}

export const { updatePlans, updatePlanInfos } = planSlice.actions
export default planSlice.reducer
