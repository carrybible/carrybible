import { Text } from '@components/Typography'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'

type Props = {
  role: string
  hasBackground?: boolean
}

const RoleChip: React.FC<Props> = ({ role, hasBackground = true }) => {
  const { t } = useTranslation()
  const isMember = role === 'member'
  const isOutsider = ![
    'admin',
    'owner',
    'campus-leader',
    'campus-user',
    'leader',
    'member',
  ].includes(role)

  const layout = useMemo(() => {
    if (isOutsider) {
      return {
        bg: 'bg-neutral-60',
        text: 'text-opacity-80',
      }
    }
    return {
      bg: hasBackground && {
        'bg-primary': !isMember,
        'bg-primary/20': isMember,
      },
      text: hasBackground && {
        'text-neutral-10': !isMember,
        'text-primary ': isMember,
      },
    }
  }, [isMember, isOutsider, hasBackground])

  return (
    <div
      className={classNames(
        hasBackground && 'w-fit rounded-[50px] px-2.5 py-1 text-center',
        layout.bg
      )}
    >
      <Text
        strong={hasBackground}
        className={classNames(layout.text, !hasBackground && 'text-neutral-80')}
      >
        {isMember ? t('member') : t(role)}
      </Text>
    </div>
  )
}

export default RoleChip
