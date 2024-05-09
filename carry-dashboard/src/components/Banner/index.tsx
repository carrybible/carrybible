import Button from '@components/Button'
import { H4, Text } from '@components/Typography'
import classNames from 'classnames'
import Image from 'next/image'
import React, { FC } from 'react'

type Props = {
  hidden?: boolean
  title: string
  content: string
  image: {
    img: any
    imgAlt: string
    width?: number
    height?: number
    className?: string
  }
  btnTitle?: string
  btnIcon?: React.ReactNode
  onClick?: () => void
  className?: string
}

const Banner: FC<Props> = ({
  hidden,
  btnTitle,
  className,
  content,
  image: { height, img, imgAlt, width, className: imageClassName },
  onClick,
  title,
  btnIcon,
}) => {
  if (hidden) {
    return null
  }
  return (
    <div
      className={classNames(
        'flex flex-col items-center rounded-2xl bg-primary-light/5 px-6 pt-6 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={`mx-2 ml-3 pb-3 sm:hidden sm:items-end`}>
        <Image
          className={classNames(
            height && `h-[${height}px]`,
            width && `w-[${width}px]`
          )}
          src={img}
          alt={imgAlt}
        />
      </div>
      <div className="pb-8">
        <div>
          <H4 className="text-start text-2xl !text-primary">{title}</H4>
        </div>
        <div className="">
          <Text className="text-center text-neutral-80 sm:text-start">
            {content}
          </Text>
        </div>
        {btnTitle ? (
          <Button
            type="primary"
            className="mt-3 w-full sm:w-auto"
            onClick={onClick}
            icon={btnIcon}
          >
            {btnTitle}
          </Button>
        ) : null}
      </div>
      <div className={`mx-2 ml-3 hidden sm:flex sm:items-end`}>
        <Image
          width={width}
          height={height}
          src={img}
          alt={imgAlt}
          className={classNames(
            height && `h-[${height}px]`,
            width && `w-[${width}px]`,
            imageClassName
          )}
        />
      </div>
    </div>
  )
}

export default Banner
