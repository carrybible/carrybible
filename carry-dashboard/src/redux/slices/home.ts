import { fetchReport } from '@redux/thunks/home'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ReportType } from '@shared/Firebase/report'

type HomePage = {
  data?: ReportType
  loading: boolean
  error: boolean
  message?: string
  showEmptyState: boolean
}

const initialState: HomePage = {
  data: undefined,
  loading: false,
  error: false,
  message: '',
  showEmptyState: false,
}

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    updateHome(state, { payload }: PayloadAction<HomePage>) {
      return {
        ...state,
        ...payload,
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchReport.fulfilled, (state, action) => {
        if (action.payload) {
          state.data = action.payload
        } else {
          state.showEmptyState = true
        }
      })
      .addCase(fetchReport.rejected, (state, action) => {
        if (action.error.message) {
          state.message = action.error.message
        }
      })
  },
})

export const { updateHome } = homeSlice.actions

export default homeSlice.reducer
