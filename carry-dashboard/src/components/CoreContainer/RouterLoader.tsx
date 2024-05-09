import useGlobalLoading from '@hooks/useGlobalLoading'
import { wait } from '@shared/Utils'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

export const RegisteredLoadingPaths: Record<string, boolean> = {}
const PageLoadingIds: Record<string, number | boolean> = {}

const RouterLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter()
  const { stopLoading, startLoading } = useGlobalLoading()

  useEffect(() => {
    const pathname = router.asPath
    const routeChangeStart = async (
      url: string,
      { shallow }: { shallow: boolean }
    ) => {
      if (shallow) {
        return
      }

      if (RegisteredLoadingPaths[pathname]) {
        PageLoadingIds[url] = true
        await wait(250)
        if (PageLoadingIds[url]) {
          PageLoadingIds[url] = await startLoading()
        }
      }
    }

    router.events.on('routeChangeStart', routeChangeStart)
    return () => {
      router.events.off('routeChangeStart', routeChangeStart)
    }
  }, [router.asPath, router.events, startLoading])

  useEffect(() => {
    const routeChangeComplete = (
      url: string,
      { shallow }: { shallow: boolean }
    ) => {
      if (shallow) {
        return
      }

      const loadingId = PageLoadingIds[url]
      if (typeof loadingId === 'number') {
        stopLoading(loadingId)
        delete PageLoadingIds[url]
      } else {
        delete PageLoadingIds[url]
      }
    }

    router.events.on('routeChangeComplete', routeChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', routeChangeComplete)
    }
  }, [router.events, stopLoading])

  return <>{children}</>
}

export default RouterLoader
