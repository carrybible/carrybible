import { Text } from '@components/Typography'
import { MemberDataType } from '@shared/Firebase/member'
import { Avatar } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { FC } from 'react'
import RoleBlock from './RoleBlock'

type Props = {
  members: MemberDataType[]
}

const MemberBlock: FC<Props> = (props) => {
  const { t } = useTranslation()

  return props.members.length > 0 ? (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'px-6 pt-3 pb-6',
        'self-center bg-neutral-10'
      )}
    >
      {props.members.map((m, index) => (
        <div
          key={`${m.name}-${index}`}
          className="mt-3 flex flex-row items-center justify-between"
        >
          <div className="items-center">
            <Avatar size={50} src={m.image} alt="avatar" />
          </div>
          <div className="flex w-full">
            <Text strong className="mx-3 self-start">
              {m.name}
            </Text>
          </div>
          {m.organisation?.role ? (
            <div>
              <RoleBlock role={m.organisation?.role} />
            </div>
          ) : null}
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
      <Text className="text-neutral-80">{t('group.no-member')}</Text>
    </div>
  )
}

export default MemberBlock
