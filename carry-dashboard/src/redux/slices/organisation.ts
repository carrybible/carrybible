import { Organisation } from '@dts/Organisation'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type OrganisationState = {
  info?: Organisation
}

const initialState: OrganisationState = {
  info: undefined,
}

const organisationSlice = createSlice({
  name: 'organisation',
  initialState,
  reducers: {
    updateOrganisation(state, { payload }: PayloadAction<OrganisationState>) {
      return {
        ...state,
        ...payload,
      }
    },
  },
})

export const { updateOrganisation } = organisationSlice.actions

export default organisationSlice.reducer
