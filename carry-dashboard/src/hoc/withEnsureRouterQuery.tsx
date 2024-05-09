import useGlobalLoading from '@hooks/useGlobalLoading'
import { isNil } from 'lodash'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

function withEnsureRouterQuery<T = AppProps>(
  WrappedComponent: React.ComponentType<T>,
  queryParams: string[]
) {
  const displayName =
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    'ComponentWithEnsureRouterQuery'

  const ComponentWithEnsureRouterQuery = React.memo((props: T) => {
    const router = useRouter()
    const { startLoading, stopLoading } = useGlobalLoading()
    const isQueryParamsExisted = queryParams.every(
      (queryParam) => !isNil(router.query[queryParam])
    )

    useEffect(() => {
      if (!isQueryParamsExisted) {
        startLoading()
      } else {
        stopLoading()
      }
    }, [isQueryParamsExisted, startLoading, stopLoading])

    if (!isQueryParamsExisted) {
      return null
    }

    return <WrappedComponent {...(props as any)} />
  })

  ComponentWithEnsureRouterQuery.displayName = `withEnsureRouterQuery(${displayName})`
  return ComponentWithEnsureRouterQuery
}

export default withEnsureRouterQuery
