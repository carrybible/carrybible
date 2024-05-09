import { H5, Text } from '@components/Typography'
import { Typography } from 'antd'
import classNames from 'classnames'

type Props = {
  onClick?: () => void
  iconText: string
  title: string
  description: string
  className?: string
}

const HelpCenterBlock: React.FC<Props> = ({
  onClick,
  iconText = '',
  title = '',
  description = '',
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'px-8 py-10',
        'rounded-[10px] border-2 border-solid border-neutral-50',
        'hover:cursor-pointer hover:border-primary',
        'flex flex-col flex-wrap items-center justify-center bg-neutral-10',
        className
      )}
    >
      {iconText && (
        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#EDEEF3]">
          <Typography className="!text-2xl">{iconText}</Typography>
        </div>
      )}
      <H5 className="mt-2 whitespace-normal">{title}</H5>
      <Text className="text-neutral-80">{description}</Text>
    </div>
  )
}

export default HelpCenterBlock
