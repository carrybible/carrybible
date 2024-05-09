import { ActiveGoal } from '@dts/Group'
import { fetchGroups } from '@redux/thunks/group'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Campus } from '@shared/Firebase/campus'

export type Group = {
  permissions: Array<string>
  name: string
  leader: {
    id: string
    name: string
  }
  id: string
  image: string
  memberCount: number
  timeZone: number // UTC
  activeGoal?: ActiveGoal
  hasActiveGoal?: boolean

  campus?: Campus
}

export type ParticipatingGroup = Group & {
  amount: number
  currency: string
}

type GroupPage = {
  listGroup: Array<{ groupByValue: string; data: Array<Group> }>
  groupNameMapping: Record<string, string>
  loading: boolean
  error: boolean
  message?: string
}

const initialState: GroupPage = {
  listGroup: [],
  groupNameMapping: {},
  loading: false,
  error: false,
  message: '',
}

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    updateGroupNameMapping(
      state,
      { payload: { id, name } }: PayloadAction<{ id: string; name: string }>
    ) {
      state.groupNameMapping[id] = name
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchGroups.fulfilled, (state, action) => {
        if (action.payload) {
          state.listGroup = action.payload
          state.listGroup.forEach((groupChunk) =>
            groupChunk.data.forEach((group) => {
              state.groupNameMapping[group.id] = group.name
            })
          )
        }
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        if (action.error.message) {
          state.message = action.error.message
        }
      })
  },
})

export const { updateGroupNameMapping } = groupSlice.actions
export default groupSlice.reducer
