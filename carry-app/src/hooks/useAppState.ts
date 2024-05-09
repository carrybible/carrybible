import { useEffect, useState } from 'react'

import { AppState, AppStateStatus } from 'react-native'

const useAppState = () => {
  const [appStatus, setAppState] = useState(AppState.currentState)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => setAppState(nextAppState)

    const susbcription = AppState.addEventListener('change', handleAppStateChange)
    return () => susbcription.remove()
  }, [])

  return { appStatus }
}

export interface AppStatusProps {
  appStatus?: AppStateStatus
}

export default useAppState
