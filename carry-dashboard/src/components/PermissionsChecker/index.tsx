import MemberEmpty from '@assets/images/MemberEmpty.png'
import Banner from '@components/Banner'
import { useAppSelector } from '@redux/hooks'
import React, { useMemo } from 'react'

export const usePermissionChecker = ({
  permissionsRequire,
  extraPermissions = [],
}: {
  permissionsRequire: string[]
  extraPermissions?: string[]
}) => {
  const currentPermissions = useAppSelector((state) => state.me.permission)

  const availablePermissionMap = useMemo(() => {
    return new Set([...(currentPermissions ?? []), ...extraPermissions])
  }, [currentPermissions, extraPermissions])

  return (
    permissionsRequire.length === 0 ||
    permissionsRequire.some((permission) =>
      availablePermissionMap.has(permission)
    )
  )
}

const NoPermission = () => {
  return (
    <div className="mt-10 flex items-center justify-center">
      <Banner
        title={'Oops!'}
        content={`You're missing permission to view this content...`}
        image={{
          img: MemberEmpty,
          imgAlt: 'Missing permission',
          width: 212,
          height: 54,
        }}
      />
    </div>
  )
}

type Props = {
  children: React.ReactNode
  permissionsRequire: string[]
  extraPermissions?: string[]
  noPermissionView?: boolean | React.ReactNode
}

const PermissionsChecker: React.FC<Props> = ({
  children,
  permissionsRequire,
  extraPermissions,
  noPermissionView = false,
}) => {
  const havePermission = usePermissionChecker({
    permissionsRequire,
    extraPermissions,
  })
  if (!havePermission) {
    if (typeof noPermissionView === 'boolean') {
      return noPermissionView ? <NoPermission /> : null
    }
    return <>{noPermissionView}</>
  }
  return <>{children}</>
}

export default PermissionsChecker
