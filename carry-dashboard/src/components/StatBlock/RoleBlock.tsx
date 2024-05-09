import { Text } from '@components/Typography'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { FC, useMemo } from 'react'

type Props = {
  role:
    | 'leader'
    | 'member'
    | 'campus-leader'
    | 'campus-owner'
    | 'admin'
    | 'owner'
    | string
}

const RoleBlock: FC<Props> = (props) => {
  const { t } = useTranslation()
  const data = useMemo(() => {
    if (props.role === 'member')
      return {
        text: t('member'),
        textColor: 'text-primary',
        backgroundColor: 'bg-primary-light',
      }

    return {
      text: t(props.role),
      textColor: 'text-neutral-10',
      backgroundColor: 'bg-primary',
    }
  }, [props.role, t])

  return (
    <div className={classNames('rounded-2xl px-3 py-1', data?.backgroundColor)}>
      <Text className={classNames(data?.textColor)}>{data?.text}</Text>
    </div>
  )
}

export default RoleBlock
