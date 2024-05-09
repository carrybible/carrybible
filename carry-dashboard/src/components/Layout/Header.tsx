import { H5, Text } from '@components/Typography'
import useCurrentMenuItem from '@hooks/useCurrentMenuItem'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { toggleMenu } from '@redux/slices/app'
import { Breadcrumb, Layout as AntLayout } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { AiOutlineMenu } from 'react-icons/ai'
import { FaRegQuestionCircle } from 'react-icons/fa'
import { OrgInfo } from './OrgInfo'

function Feedback() {
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <div
      id="carry-feedback"
      className={classNames(
        'hidden rounded-lg p-2.5 sm:flex',
        'hover:cursor-pointer hover:bg-primary/5 hover:shadow-[0px_8px_15px_0px_rgba(0,0,0,0.05)]'
      )}
    >
      <Text
        onClick={() => router.push('/help-center')}
        strong
        className={classNames(
          'inline-flex flex-row items-center gap-2 text-primary',
          'hover:text-primary/80 active:text-primary-light'
        )}
      >
        <FaRegQuestionCircle /> {t('help-feedback')}
      </Text>
    </div>
  )
}

const MobileHeader = () => {
  const dispatch = useAppDispatch()
  const currentMenuItem = useCurrentMenuItem()
  // const me = useAppSelector((state) => state.me)
  return (
    <div
      className={classNames(
        'sm:hidden',
        '-mx-[50px] h-full w-full',
        'flex flex-row items-center justify-between px-3 py-0 sm:py-2',
        'bg-neutral-10'
      )}
    >
      <AiOutlineMenu
        className="text-3xl text-primary active:opacity-50"
        onClick={() => {
          dispatch(toggleMenu())
        }}
      />
      <H5 className="!mb-0">{currentMenuItem?.label}</H5>
      <div className="flex sm:hidden">
        <OrgInfo />
      </div>
    </div>
  )
}

const BreadcrumbDashboard = () => {
  const router = useRouter()
  const breadcrumbs = useAppSelector((state) => state.app.breadcrumbs)

  const routes = useMemo(() => {
    const nestedRouteParts = router.asPath
      .split('?')[0]
      .split('/')
      .filter((v) => v.length > 0)
    let accPath = ''

    return nestedRouteParts.map((routePart) => {
      accPath += `/${routePart}`
      return {
        breadcrumbName: breadcrumbs[accPath] ?? routePart,
        path: accPath,
      }
    })
  }, [breadcrumbs, router.asPath])

  return (
    <Breadcrumb
      className="mt-6 ml-5 self-start sm:mt-0 sm:ml-0 sm:self-center"
      separator=">"
      routes={routes.length > 1 ? routes : []}
      itemRender={(route, params, routes) => {
        const last = routes.indexOf(route) === routes.length - 1
        return last ? (
          <span>{route.breadcrumbName}</span>
        ) : (
          <Link href={route.path}>
            <a>{route.breadcrumbName}</a>
          </Link>
        )
      }}
    />
  )
}

const Header = () => {
  return (
    <AntLayout.Header
      className={classNames(
        'bg-neutral-40 sm:px-3',
        'flex flex-col items-center justify-between sm:flex-row',
        'mx-auto min-h-[56px] w-full max-w-[920px] sm:min-h-[80px]'
      )}
    >
      <MobileHeader />
      <BreadcrumbDashboard />
      <Feedback />
    </AntLayout.Header>
  )
}

export default Header
