import { useCallback, useEffect } from 'react'

import { BackHandler } from 'react-native'

const useBack = (callback?: () => void) => {
  const onBack = useCallback(() => {
    if (typeof callback === 'function') {
      callback()
    }
    return true
  }, [callback])

  useEffect(() => {
    const susbcription = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => susbcription.remove()
  }, [onBack])

  return onBack
}

export default useBack
