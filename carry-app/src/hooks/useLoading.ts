import { RootState } from '@dts/state'
import { TYPES } from '@redux/actions'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useLoading: () => { showLoading: (message?: string) => void; hideLoading: () => void; loading: boolean } = () => {
  const { loading } = useSelector<RootState, { loading: boolean; loadingMessage?: string }>(state => state.screen)
  const dispatch = useDispatch()

  const showLoading = useCallback(
    (message?: string) => {
      dispatch({ type: TYPES.SCREEN.SHOW_LOADING, payload: { message: message } })
    },
    [dispatch],
  )

  const hideLoading = useCallback(() => {
    dispatch({ type: TYPES.SCREEN.HIDE_LOADING })
  }, [dispatch])

  return { showLoading, hideLoading, loading }
}

export default useLoading
