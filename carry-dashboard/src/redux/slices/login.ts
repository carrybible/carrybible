import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type LoginStageType =
  | 'login'
  | 'sending-link'
  | 'resend-link'
  | 'opening-dashboard'
  | 'logging-out'

const initialState: {
  email: string
  stage: LoginStageType
} = {
  email: '',
  stage: 'login',
}

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    updateLoginEmail(state, { payload: email }: PayloadAction<string>) {
      state.email = email
    },
    changeLoginStage(state, { payload: stage }: PayloadAction<LoginStageType>) {
      state.stage = stage
    },
    resetLogin() {
      return initialState
    },
  },
})

export const { updateLoginEmail, changeLoginStage, resetLogin } =
  loginSlice.actions
export default loginSlice.reducer
