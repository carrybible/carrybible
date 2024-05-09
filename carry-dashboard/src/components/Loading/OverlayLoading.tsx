import CircleLoading from '@components/Loading/CircleLoading'
import { H5 } from '@components/Typography'
import classNames from 'classnames'
import React from 'react'
import { createPortal } from 'react-dom'

type Props = {
  isShowing: boolean
  message?: string
  background?: 'primary' | 'normal'
}

const OverlayLoading: React.FC<Props> = ({
  isShowing,
  message,
  background = 'normal',
}) => {
  return createPortal(
    <div
      className={classNames(
        'flex flex-col items-center justify-center',
        'fixed inset-0 z-[9999]',
        {
          hidden: !isShowing,
          'bg-primary': background === 'primary',
          'bg-neutral-80/20': background === 'normal',
        }
      )}
    >
      <CircleLoading />
      {message && (
        <H5
          className={classNames({
            'text-neutral-10': background === 'primary',
            'text-neutral-100': background === 'normal',
          })}
        >
          {message}
        </H5>
      )}
    </div>,
    document.getElementById('loading-portal')!
  )
}

export default OverlayLoading
