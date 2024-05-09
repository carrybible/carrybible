import * as React from 'react'
import Image from 'next/image'
import IconLeft from '@assets/icons/ArrowLeft.svg'
import IconRight from '@assets/icons/ArrowRight.svg'
import classNames from 'classnames'

const ArrowLeft = () => (
  <div className="flex h-[24px] w-[44px] items-center justify-center rounded-lg border-2 border-solid border-neutral-50 bg-neutral-10 sm:h-[32px] sm:w-[44px]">
    <Image src={IconLeft} alt="arrow-left" className="self-center" />
  </div>
)

const ArrowRight = ({ border = true, className = '' }) => {
  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded-lg bg-neutral-10',
        border &&
          'h-[24px] w-[44px] border-2 border-solid border-neutral-50 sm:h-[32px] sm:w-[44px]',
        !border && 'h-[24px]',
        className
      )}
    >
      <Image src={IconRight} alt="arrow-right" className="self-center" />
    </div>
  )
}

export { ArrowLeft, ArrowRight }
