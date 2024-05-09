import CarryAppIcon from '@assets/icons/CarryAppIcon'
import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import { usePermissionChecker } from '@components/PermissionsChecker'
import { H5 } from '@components/Typography'
import useCurrentMenuItem from '@hooks/useCurrentMenuItem'
import useMenuItem from '@hooks/useMenuItems'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { toggleMenu } from '@redux/slices/app'
import { wait } from '@shared/Utils'
import classNames from 'classnames'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { UserInfo } from './UserInfo'
import { OrgInfo } from './OrgInfo'
import { MobileLogoutButton } from '@components/MobileLogoutButton'
import { MobileFeedbackButton } from '@components/MobileFeedbackButton'
import { useRouter } from 'next/router'

const AppLogo = () => (
  <div
    className={classNames(
      'mb-3 w-full flex-row items-center gap-1',
      'hidden sm:flex'
    )}
  >
    <CarryAppIcon />
    <span className="!font-['Poppins-SemiBold'] text-[36px] font-bold leading-[54px] text-primary">
      Carry
    </span>
  </div>
)

const MenuItem = ({
  menuItem,
  isSelected,
}: {
  menuItem: {
    path: string
    icon: any
    iconSelected: any
    label: string
    iconAlt: string
    permission?: string
    key: string
  }
  isSelected: boolean
}) => {
  const dispatch = useAppDispatch()
  const isMobile = useAppSelector((state) => state.app.isMobile)

  const permit = usePermissionChecker({
    permissionsRequire: menuItem.permission ? [menuItem.permission] : [],
  })

  if (!permit) {
    return null
  }

  return (
    <Link href={menuItem.path}>
      <div
        className={classNames(
          'flex flex-row items-center gap-4',
          'mb-4 py-5 px-[10px]',
          'rounded-lg hover:cursor-pointer hover:bg-neutral-50/25',
          isSelected && 'bg-neutral-50/75'
        )}
        onClick={async () => {
          if (isMobile) {
            await wait(250)
            dispatch(toggleMenu(false))
          }
        }}
      >
        <Image
          src={isSelected ? menuItem.iconSelected : menuItem.icon}
          alt={menuItem.iconAlt}
          width={isMobile ? 18 : 32}
          height={isMobile ? 18 : 32}
        />

        <H5 className="!mb-0" strong={isSelected}>
          {menuItem.label}
        </H5>
      </div>
    </Link>
  )
}

const MobileCloseButton = (props: { onClick: () => void }) => (
  <div
    className={classNames(
      'mb-2 flex justify-end hover:cursor-pointer active:opacity-50',
      'sm:hidden'
    )}
    onClick={props.onClick}
  >
    <Image src={XCircleIcon} width={32} height={32} alt="Close Icon" />
  </div>
)

const MenuWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-screen">
    <div className="bg absolute top-0 left-0 flex h-screen w-full flex-col pt-10 pb-10 pl-6 pr-6 sm:pl-10">
      {children}
    </div>
  </div>
)

const LeftMenu: React.FC = () => {
  const dispatch = useAppDispatch()
  const currentMenuItem = useCurrentMenuItem()
  const [width, setWidth] = useState<number>(window.innerWidth)
  const router = useRouter()

  function handleWindowSizeChange() {
    setWidth(window.innerWidth)
  }

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [])

  const isMobile = width <= 768

  const menuItems = useMenuItem()?.filter((x) => !x.disable)

  return (
    <MenuWrapper>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <MobileCloseButton
            onClick={() => {
              dispatch(toggleMenu(false))
            }}
          />
          <AppLogo />
          {isMobile ? (
            <div className="flex w-full flex-1 pt-2 pb-10 sm:hidden sm:pt-4">
              <UserInfo />
            </div>
          ) : null}

          <div className="hidden sm:flex">
            <OrgInfo isOnlyAvatar={false} />
          </div>
          {menuItems.map((menuItem) => (
            <MenuItem
              key={menuItem.key}
              menuItem={menuItem}
              isSelected={currentMenuItem?.key === menuItem.key}
            />
          ))}

          <div
            className="flex flex-col sm:hidden"
            onClick={() => {
              dispatch(toggleMenu(false))
              router.push('/help-center')
            }}
          >
            <MobileFeedbackButton />
            <MobileLogoutButton />
          </div>
        </div>
        <>
          {!isMobile ? (
            <div className="hidden w-full pt-4 sm:flex">
              <UserInfo />
            </div>
          ) : null}
        </>
      </div>
    </MenuWrapper>
  )
}

export default LeftMenu
