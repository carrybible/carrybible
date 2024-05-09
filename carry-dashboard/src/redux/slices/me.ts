import { User, UserOrganisation } from '@dts/User'
import { updateAccountPermissions } from '@redux/thunks/me'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type MeType = User & {
  permission: string[]
  campusAccess: {
    id: string
    name: string
  }[]
  organisation?: UserOrganisation
}

const initialState = {
  permission: [],
  campusAccess: [],
  organisation: {},
} as unknown as MeType

const meSlice = createSlice({
  name: 'me',
  initialState,
  reducers: {
    updateMe(state, { payload }: PayloadAction<User>) {
      return {
        ...state,
        ...payload,
      }
    },
  },
  extraReducers(builder) {
    builder.addCase(updateAccountPermissions.fulfilled, (state, actions) => {
      // state.permission = actions.payload.permissions
      state.campusAccess =
        actions.payload?.campusAccess?.filter((campus) => !!campus.id) ?? []
      state.organisation =
        actions.payload?.organisation ?? ({} as UserOrganisation)
    })
  },
})

export const { updateMe } = meSlice.actions
export default meSlice.reducer
