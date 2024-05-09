import Firebase from '@shared/Firebase/index'
import { doc, getDoc } from 'firebase/firestore'

import { httpsCallable } from 'firebase/functions'

export const getSettings = async (): Promise<{
  message?: string
  success: boolean
  data: any
}> => {
  const funcGetGroups = httpsCallable(Firebase.functions, 'func_get_groups')
  const {
    data: { data, success, message },
  } = (await funcGetGroups()) as { data: any }

  if (data) return { data, success, message }
  return { data, success, message }
}

export const getCurrencies = async (): Promise<{
  [key: string]: {
    suggestions: number[]
    symbol: string
    value: string
    flag?: string
  }
}> => {
  const currenciesRef = doc(
    Firebase.firestore,
    Firebase.collections.SETTINGS,
    Firebase.collections.CURRENCIES
  )
  return (await (await getDoc(currenciesRef)).data()) as {
    [key: string]: {
      suggestions: number[]
      symbol: string
      value: string
    }
  }
}
