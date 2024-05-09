import OverlayLoading from '@components/Loading/OverlayLoading'
import OverlayHighlight from '@components/OverlayHighlight'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { setIsMobile, toggleMenu } from '@redux/slices/app'
import { Layout as AntLayout } from 'antd'
import classNames from 'classnames'
import React, { useEffect } from 'react'

import Header from './Header'
import LeftMenu from './LeftMenu'

type Props = {
  children: React.ReactNode
}

const MenuOverlay = () => (
  <div className="absolute top-0 left-0 bottom-0 right-0 z-10 bg-neutral-100/50 sm:hidden" />
)

const Layout: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch()
  const {
    isOpenMenu,
    isMobile,
    isLoading,
    loadingMessage,
    loadingBackground,
    isHighlight,
  } = useAppSelector((state) => state.app)

  useEffect(() => {
    const isMobile = window.screen.width <= 576
    dispatch(setIsMobile(isMobile))
    dispatch(toggleMenu(!isMobile))
  }, [dispatch, isMobile])

  if (isMobile == null) {
    return null
  }

  return (
    <AntLayout hasSider className="relative bg-neutral-40">
      <AntLayout.Sider
        collapsible
        breakpoint="sm"
        collapsed={!isOpenMenu}
        width={300}
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          dispatch(toggleMenu(!broken))
          dispatch(setIsMobile(broken))
        }}
        trigger={null}
        className={classNames(
          'fixed inset-y-0 left-0 z-20 h-screen overflow-auto rounded-r-2xl bg-neutral-10'
        )}
      >
        <LeftMenu />
      </AntLayout.Sider>
      <AntLayout
        className={classNames(
          'min-h-screen bg-neutral-40 transition-[margin]',
          {
            'sm:ml-[300px]': isOpenMenu,
          }
        )}
      >
        {isOpenMenu && <MenuOverlay />}
        <Header />
        <AntLayout.Content>{children}</AntLayout.Content>
      </AntLayout>
      <OverlayLoading
        isShowing={isLoading}
        message={loadingMessage}
        background={loadingBackground}
      />
      <OverlayHighlight isShowing={isHighlight} />
    </AntLayout>
  )
}

export default Layout
