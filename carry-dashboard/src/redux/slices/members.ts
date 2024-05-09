import { MembersTableDataType } from '@components/Table/MembersTable'
import { User } from '@dts/User'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type MembersState = {
  cacheData?: Partial<MembersTableDataType>
  membersInfo: Record<
    string,
    {
      name: string
      image: string
    }
  >
}

const initialState: MembersState = {
  membersInfo: {},
}

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    cacheMembersData(
      state,
      { payload }: PayloadAction<Partial<MembersTableDataType>>
    ) {
      state.cacheData = payload
      payload.dataSource?.forEach(
        (member) =>
          (state.membersInfo[member.uid] = {
            name: member.name,
            image: member.image,
          })
      )
    },
    addMemberInfos(state, { payload: memberInfos }: PayloadAction<User[]>) {
      memberInfos.forEach((memberInfo) => {
        state.membersInfo[memberInfo.uid] = {
          name: memberInfo.name!,
          image: memberInfo.image!,
        }
      })
    },
  },
})

export const { cacheMembersData, addMemberInfos } = membersSlice.actions
export default membersSlice.reducer
