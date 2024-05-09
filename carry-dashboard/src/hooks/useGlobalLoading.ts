import { useAppDispatch, useAppSelector } from '@redux/hooks'
import {
  startLoading as startLoadingAction,
  stopLoading as stopLoadingAction,
} from '@redux/slices/app'
import { useCallback } from 'react'

const useGlobalLoading = () => {
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((state) => state.app.isLoading)

  const startLoading = useCallback(
    async (
      options: {
        message?: string
        background?: 'primary' | 'normal'
      } = {}
    ) => {
      const data = await dispatch(
        startLoadingAction({
          message: options.message,
          background: options.background,
        })
      )
      return (data.payload as { loadingId: number }).loadingId
    },
    [dispatch]
  )

  const stopLoading = useCallback(
    (loadingId?: number) => {
      dispatch(stopLoadingAction(loadingId))
    },
    [dispatch]
  )

  return {
    isLoading,
    startLoading,
    stopLoading,
  }
}

export default useGlobalLoading
