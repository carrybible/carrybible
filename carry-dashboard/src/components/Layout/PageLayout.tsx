import { RegisteredLoadingPaths } from '@components/CoreContainer/RouterLoader'
import { H2 } from '@components/Typography'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateGiving } from '@redux/slices/giving'
import { getCurrencies } from '@shared/Firebase/settings'
import classNames from 'classnames'
import { values } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  title?: string
  isEmpty?: boolean
  emptyComponent?: React.ReactNode
  routeChangeLoading?: boolean
}

const PageLayout: React.FC<Props> = ({
  children,
  className,
  title,
  isEmpty = false,
  emptyComponent = null,
  routeChangeLoading = false,
}) => {
  const dispatch = useAppDispatch()
  const giving = useAppSelector((state) => state.giving)
  const router = useRouter()

  useEffect(() => {
    if (routeChangeLoading && router.asPath) {
      RegisteredLoadingPaths[router.asPath] = true
    }

    const fetchData = async () => {
      try {
        if (giving.currencies?.length === 0) {
          const currencies = await getCurrencies()
          dispatch(
            updateGiving({
              currencies: values(currencies),
              settingCurrencies: currencies,
            })
          )
        }
      } catch (error) {}
    }

    fetchData()
  }, [dispatch, giving.currencies?.length, routeChangeLoading, router.asPath])
  return (
    <div
      className={classNames(
        'flex flex-col',
        'mx-auto max-w-[920px] px-4 py-4',
        className
      )}
    >
      <H2 className={classNames('text-4 mt-2 hidden sm:flex')}>{title}</H2>

      {!isEmpty ? children : emptyComponent}
    </div>
  )
}
export default PageLayout
