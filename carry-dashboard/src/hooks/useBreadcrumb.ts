import { useAppDispatch } from '@redux/hooks'
import { addBreadcrumbLabel } from '@redux/slices/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const useBreadcrumb = ({
  label,
  previousLabel,
  indexLevel,
}: {
  label: string
  previousLabel?: string
  indexLevel?: { index: number; label: string }
}) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(
      addBreadcrumbLabel({
        pathname: router.asPath.split('?')[0],
        label,
      })
    )
    // No need to watch for router.pathname changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, label])

  useEffect(() => {
    if (!previousLabel) {
      return
    }
    const paths = router.asPath.split('?')[0].split('/')
    paths.pop()
    dispatch(
      addBreadcrumbLabel({
        pathname: paths.join('/'),
        label: previousLabel,
      })
    )
    // No need to watch for router.pathname changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, previousLabel])

  useEffect(() => {
    if (!indexLevel) {
      return
    }
    const paths = router.asPath.split('?')[0].split('/')
    paths.splice(indexLevel.index + 1)
    dispatch(
      addBreadcrumbLabel({
        pathname: paths.join('/'),
        label: indexLevel.label,
      })
    )
    // No need to watch for router.pathname changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, indexLevel])
}

export default useBreadcrumb
