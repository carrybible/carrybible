import PermissionsChecker from '@components/PermissionsChecker'
import type { AppProps } from 'next/app'
import React from 'react'

type Options = Omit<React.ComponentProps<typeof PermissionsChecker>, 'children'>

function withPagePermissionChecker<T = AppProps>(
  WrappedComponent: React.ComponentType<T>,
  options: Options
) {
  const displayName =
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    'ComponentWithPermissionChecker'

  const ComponentWithPermissionChecker = (props: T) => {
    return (
      <PermissionsChecker {...options}>
        <WrappedComponent {...(props as any)} />
      </PermissionsChecker>
    )
  }

  ComponentWithPermissionChecker.displayName = `withPagePermissionChecker(${displayName})`
  return ComponentWithPermissionChecker
}

export default withPagePermissionChecker
