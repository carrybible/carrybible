import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState: {
  isOpenMenu: boolean
  isMobile?: boolean

  isLoading: boolean
  loadingId?: number
  loadingMessage?: string
  loadingBackground?: 'primary' | 'normal'

  isHighlight: boolean

  breadcrumbs: {
    [pathname: string]: string
  }
} = {
  isOpenMenu: true,
  isMobile: undefined,
  isLoading: false,
  isHighlight: false,
  breadcrumbs: {
    '/groups': 'Groups',
    '/members': 'Members',
    '/settings/users': 'Users',
    '/settings': 'Settings',
    '/plans': 'Plans',
    '/giving': 'Giving',
    '/tithing': 'Tithing',
  },
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleMenu(
      state,
      { payload: isOpenMenu }: PayloadAction<boolean | undefined>
    ) {
      if (isOpenMenu != null) {
        state.isOpenMenu = isOpenMenu
        return
      }
      state.isOpenMenu = !state.isOpenMenu
    },
    setIsMobile(state, { payload: isMobile }: PayloadAction<boolean>) {
      state.isMobile = isMobile
    },
    startLoading(state) {
      state.isLoading = true
      state.loadingId = Date.now()
    },
    stopLoading(
      state,
      { payload: loadingId }: PayloadAction<number | undefined>
    ) {
      if (loadingId && loadingId !== state.loadingId) {
        return
      }
      state.isLoading = false
      state.loadingMessage = undefined
      state.loadingBackground = undefined
    },
    addBreadcrumbLabel(
      state,
      { payload }: PayloadAction<{ pathname: string; label?: string }>
    ) {
      if (payload.label) {
        state.breadcrumbs[payload.pathname] = payload.label
      }
    },
    showHighlight(state) {
      if (!state.isLoading) {
        state.isHighlight = true
        state.isLoading = false
      }
    },
    hideHighlight(state) {
      state.isHighlight = false
    },
  },
  extraReducers(builder) {
    builder.addCase(startLoading.fulfilled, (state, action) => {
      state.isLoading = true
      state.loadingId = action.payload.loadingId
      if (action.payload.message) {
        state.loadingMessage = action.payload.message
      }
      if (action.payload.background) {
        state.loadingBackground = action.payload.background
      }
    })
  },
})

export const startLoading = createAsyncThunk(
  'app/startLoading',
  async (
    options: {
      message?: string
      background?: 'primary' | 'normal'
    } = {}
  ) => {
    return {
      loadingId: Date.now(),
      ...options,
    }
  }
)

export const {
  toggleMenu,
  setIsMobile,
  stopLoading,
  addBreadcrumbLabel,
  showHighlight,
  hideHighlight,
} = appSlice.actions
export default appSlice.reducer
