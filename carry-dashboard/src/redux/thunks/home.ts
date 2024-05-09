import { startLoading, stopLoading } from '@redux/slices/app'
import { RootState } from '@redux/store'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { getReport, ReportType } from '@shared/Firebase/report'

export const fetchReport = createAsyncThunk(
  'home/fetchReport',
  async (
    _,
    { rejectWithValue, dispatch, getState }
  ): Promise<ReportType | undefined> => {
    try {
      const state = getState() as RootState
      if (!state.home.data) {
        dispatch(startLoading())
      }
      const orgId = state.me.organisation!.id
      if (!orgId) {
        throw new Error('orgId not found')
      }
      const scopeReport =
        state.me.organisation?.role === 'campus-user' ||
        state.me.organisation?.role === 'campus-leader'
          ? 'campus'
          : 'organisation'

      const scopeReportId =
        scopeReport === 'campus'
          ? state.me.organisation?.campusId ?? ''
          : scopeReport === 'organisation'
          ? orgId
          : ''
      const { success, message, data } = await getReport({
        scope: scopeReport,
        scopeId: scopeReportId,
      })
      if (!success) {
        throw new Error(message)
      }
      dispatch(stopLoading())
      return data
    } catch (error) {
      rejectWithValue(error)
      dispatch(stopLoading())
    }
  }
)
