import _ from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import Link from 'next/link'
import { Empty, Pagination } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { H5, Text } from '@components/Typography'
import { ArrowLeft, ArrowRight } from '@components/Table/components/Arrow'
import { Campaign } from '@dts/Campaign'
import { getCampaignDateStatus, toCurrency } from '@shared/Utils'
import { useAppSelector } from '@redux/hooks'

const DEFAULT_PAGE_SIZE = 4

export const CampaignList = ({ campaigns }: { campaigns: Campaign[] }) => {
  const { t } = useTranslation()
  const giving = useAppSelector((state) => state.giving)

  const [currentPage, setCurrentPage] = useState<number>(1)

  const data = useMemo(() => {
    const offset = DEFAULT_PAGE_SIZE * (currentPage - 1)

    return campaigns.slice(offset, DEFAULT_PAGE_SIZE * currentPage)
  }, [campaigns, currentPage])

  const dateStatus = useCallback(
    (item: Campaign) => {
      return getCampaignDateStatus(item, t)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const getSymbol = (currency: string) =>
    giving.settingCurrencies?.[currency]?.symbol

  return !_.isEmpty(data) ? (
    <>
      <div className="flex">
        <div className="mt-6 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          {data.map((item, i) => (
            <Link href={`/campaigns/${item.id}`} key={i}>
              <a className="rounded-lg bg-neutral-10 p-4 drop-shadow-md">
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.image}
                    alt=""
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
                <div className="mt-4 flex flex-col">
                  <H5 className="mb-1">{item.name}</H5>
                  <Text className="text-neutral-80">
                    {item.organization.name}
                  </Text>
                  <div className="mt-4 mb-3 h-3 w-full rounded-full bg-neutral-50 dark:bg-neutral-50">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          (item.totalFunds / item.goalAmount) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-neutral-80">{dateStatus(item)}</Text>
                    <Text>
                      {`${
                        (item.totalFunds || 0) >= (item.goalAmount || 0)
                          ? '🎉'
                          : ''
                      } ${t('giving.campaign-of-goal', {
                        curr: toCurrency(item.totalFunds || 0),
                        total: toCurrency(item.goalAmount || 0),
                        symbol: getSymbol(item.currency),
                      })}`}
                    </Text>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex justify-center pt-6">
        <Pagination
          showLessItems={false}
          showSizeChanger={false}
          hideOnSinglePage={true}
          itemRender={(page, type) => {
            switch (type) {
              case 'prev':
                return <ArrowLeft />
              case 'next':
                return <ArrowRight />
              default:
                return <span className="text-base">{page}</span>
            }
          }}
          onChange={(page) => {
            setCurrentPage(page)
          }}
          total={campaigns.length}
          pageSize={DEFAULT_PAGE_SIZE}
          current={currentPage}
        />
      </div>
    </>
  ) : (
    <div className="my-24 flex justify-center">
      <Empty />
    </div>
  )
}
