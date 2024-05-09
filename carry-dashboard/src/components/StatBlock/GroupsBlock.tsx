import { Text } from '@components/Typography'
import { Avatar } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { FC } from 'react'
import RoleBlock from './RoleBlock'
import _ from 'lodash'

type Props = {
  groups: {
    id: string
    image: string
    name: string
    role?:
      | 'leader'
      | 'member'
      | 'campus-leader'
      | 'campus-owner'
      | 'admin'
      | 'owner'
  }[]
  limit?: number
}

const GroupsBlock: FC<Props> = ({ groups, limit }) => {
  const { t } = useTranslation()
  if (limit) {
    groups = _(groups).drop(0).take(limit).value()
  }
  return (
    <div
      className={classNames(
        'rounded-2xl border-2 border-solid border-neutral-50',
        'px-6 pt-3 pb-6',
        'self-center bg-neutral-10'
      )}
    >
      {groups.length > 0 ? (
        groups.map((m) => (
          <div
            key={`${m.id}`}
            className="mt-3 flex flex-row items-center justify-between"
          >
            <div className="flex items-center">
              <Avatar size={50} src={m.image} alt="avatar" />
            </div>
            <div className="flex w-full">
              <Text strong className="mx-3 self-start">
                {m.name}
              </Text>
            </div>
            {m.role ? (
              <div>
                <RoleBlock role={m.role} />
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div className="mt-3">
          <Text className="self-center">{t('members.have-no-group')}</Text>
        </div>
      )}
    </div>
  )
}

export default GroupsBlock
