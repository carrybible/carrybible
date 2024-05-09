import { H5, Text } from '@components/Typography'
import { Block } from '@dts/Plans'
import { User } from '@dts/User'
import { hideHighlight } from '@redux/slices/app'
import { getActTypeIcon } from '@shared/Utils'
import { Avatar, Button } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import * as React from 'react'
import { useDispatch } from 'react-redux'

type Props = {
  me: User
  block: Block
  dayIndex: number
  className?: string
  onClick?: () => void
}

const PlanDayBlock: React.FC<Props> = ({
  className,
  block,
  dayIndex,
  onClick,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const actTypeIcons = block.activities.map((act) =>
    getActTypeIcon(act.type, act.type === 'action' ? act.actionType : undefined)
  )

  return (
    <div
      onClick={() => {
        dispatch(hideHighlight())
        typeof onClick === 'function' && onClick()
      }}
      className={classNames(
        'h-44 w-44 px-5 py-8',
        'sm:h-52 sm:w-52 sm:px-6',
        'rounded-[10px] border-2 border-solid border-neutral-50',
        'hover:border-primary-light',
        'flex flex-col flex-wrap bg-neutral-10',
        block.name && block.activities.length > 0 && 'border-primary',
        className
      )}
    >
      <H5 className="whitespace-normal">
        {block.name || t('plans.day-name-untitled')}
      </H5>
      <Text className="mt-1 text-neutral-80">
        {t('plans.day-index', { indexValue: dayIndex + 1 })}
      </Text>
      <Avatar.Group maxCount={5} className="flex-1 items-end">
        {actTypeIcons.map((icon, index) => (
          <Avatar key={index} className="bg-[#EDEEF3]">
            {icon}
          </Avatar>
        ))}
      </Avatar.Group>
    </div>
  )
}

export const AddPlanDayBlock: React.FC<{
  className?: string
  onClick?: () => void
}> = ({ className, onClick }) => {
  const { t } = useTranslation()
  return (
    <Button
      onClick={onClick}
      className={classNames(
        'h-44 w-44 px-5 py-9',
        'sm:h-52 sm:w-52 sm:px-6 sm:py-6',
        'flex flex-col flex-wrap items-center justify-center bg-neutral-40',
        'rounded-[10px] border-2 border-dashed border-[#DFE1E9]',
        'text-lg font-bold text-neutral-100',
        'hover:border-[#a5a5a5]',
        className
      )}
    >
      {t('plans.add-a-day')}
    </Button>
  )
}

export default PlanDayBlock
