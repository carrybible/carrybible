import { createAsyncThunk } from '@reduxjs/toolkit'
import { fetchDashboardAccount } from '@shared/Firebase/account'
import { useRouter } from 'next/router'

export const updateAccountPermissions = createAsyncThunk(
  'me/updateAccountDashboard',
  async (_, thunkAPI) => {
    const route = useRouter()
    try {
      const dashboardAccount = await fetchDashboardAccount()
      return dashboardAccount
    } catch (error) {
      thunkAPI.rejectWithValue(error)
      //Missing authen or session timeout
      sessionStorage.clear()
      localStorage.clear()
      route.push('/')
    }
  }
)
