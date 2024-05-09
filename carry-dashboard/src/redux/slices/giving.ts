import { TithingFundDetail } from '@dts/Giving'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type GivingPage = {
  settingCurrencies?: {
    [key: string]: {
      suggestions: number[]
      symbol: string
      value: string
    }
  }
  currencies?: {
    suggestions: number[]
    symbol: string
    value: string
    flag?: string
  }[]
  suggestAmounts?: number[]
  currentCurrenciesGiving?: string | undefined
  fundInfos?: TithingFundDetail | undefined
}

const initialState: GivingPage = {
  settingCurrencies: {},
  currencies: [],
  suggestAmounts: [],
  currentCurrenciesGiving: undefined,
  fundInfos: undefined,
}

const givingSlice = createSlice({
  name: 'giving',
  initialState,
  reducers: {
    updateGiving(state, { payload }: PayloadAction<GivingPage>) {
      return {
        ...state,
        ...payload,
      }
    },
  },
})

export const { updateGiving } = givingSlice.actions

export default givingSlice.reducer
