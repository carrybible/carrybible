import { Text } from '@components/Typography'
import { CampusBlockType } from '@shared/Firebase/giving'
import { Avatar } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { FC } from 'react'

type Props = {
  campuses: CampusBlockType[]
}

const CampusBlock: FC<Props> = (props) => {
  const { t } = useTranslation()

  return props.campuses.length > 0 ? (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'px-6 pt-3 pb-6',
        'self-center bg-neutral-10'
      )}
    >
      {props.campuses.map((m, index) => (
        <div
          key={`${m.name}-${index}`}
          className="mt-3 flex flex-row items-center justify-between"
        >
          <div className="items-center">
            <Avatar size={50} src={m.avatar} alt="avatar" />
          </div>
          <div className="flex w-full">
            <Text strong className="mx-3 self-start">
              {m.name}
            </Text>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        '!mt-5 px-6 pt-6 pb-6',
        'self-center bg-neutral-10',
        'flex justify-center'
      )}
    >
      <Text className="text-neutral-80">{t('giving.no-campuses')}</Text>
    </div>
  )
}

export default CampusBlock
