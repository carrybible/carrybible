import { RootState } from '@dts/state'
import Smartlook from '@shared/Smartlook'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

const useScreenChanged = () => {
  const { currentScreen } = useSelector<RootState, RootState['screen']>(state => state.screen)

  useEffect(() => {
    devLog('NAVIGATED TO', currentScreen || 'SplashScreen')
    if (currentScreen) {
      Smartlook.trackNavigationEvent(currentScreen, Smartlook.ViewState.Enter)
    }
  }, [currentScreen])
}

export default useScreenChanged
