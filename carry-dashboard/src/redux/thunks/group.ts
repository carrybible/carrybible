import { startLoading, stopLoading } from '@redux/slices/app'
import { Group } from '@redux/slices/group'
import { RootState } from '@redux/store'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { getGroups } from '@shared/Firebase/group'

export const fetchGroups = createAsyncThunk(
  'group/fetchGroups',
  async (
    {
      searchText,
      scope,
      forceLoading = false,
      onSuccess = () => {},
    }: {
      searchText: string
      scope: string
      forceLoading?: boolean
      onSuccess?: (data: any) => void
    },
    { rejectWithValue, getState, dispatch }
  ): Promise<
    | Array<{
        groupByValue: string
        data: Array<Group>
      }>
    | undefined
  > => {
    try {
      const state = getState() as RootState
      if (state.group.listGroup.length === 0 || forceLoading) {
        dispatch(startLoading())
      }
      const { data, success, message } = await getGroups({ searchText, scope })
      if (!success) rejectWithValue(message)
      onSuccess?.(data)
      dispatch(stopLoading())
      return data
    } catch (error) {
      rejectWithValue(error)
    }
  }
)
