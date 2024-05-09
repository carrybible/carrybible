import ListAvatar from '@components/ListAvatar'
import { H2, H5, Text } from '@components/Typography'
import { BasicUserType } from '@shared/Firebase/report'
import classNames from 'classnames'
import * as React from 'react'
import { useAppSelector } from '@redux/hooks'

type Props = {
  className?: string
  stat: number | string
  title: string
  users?: Array<BasicUserType>
}

const SquareStatBlock: React.FC<Props> = (props) => {
  const isMobile = useAppSelector((state) => state.app.isMobile)
  return (
    <div
      className={classNames(
        'h-44 w-44 px-5 py-9',
        'sm:h-52 sm:w-52 sm:px-6 sm:py-10',
        'rounded-[10px] border-2 border-solid border-neutral-50',
        'flex flex-col flex-wrap bg-neutral-10',
        props.className
      )}
    >
      {isMobile ? (
        <H2 className="mb-0 sm:mb-3">{props.stat}</H2>
      ) : (
        <H5>{props.stat}</H5>
      )}
      <Text className="mt-1 text-neutral-80">{props.title}</Text>
      {props.users && props.users.length > 0 && (
        <div className="flex flex-1 items-end">
          <ListAvatar users={props.users} />
        </div>
      )}
    </div>
  )
}

export default SquareStatBlock
