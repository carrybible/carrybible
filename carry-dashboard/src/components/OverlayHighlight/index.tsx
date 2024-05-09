import { useAppDispatch } from '@redux/hooks'
import { hideHighlight } from '@redux/slices/app'
import classNames from 'classnames'
import React from 'react'
import { createPortal } from 'react-dom'

type Props = {
  isShowing: boolean
  background?: 'primary' | 'normal'
}

const OverlayHighlight: React.FC<Props> = ({
  isShowing,
  background = 'normal',
}) => {
  const dispatch = useAppDispatch()

  return createPortal(
    <div
      onClick={() => {
        dispatch(hideHighlight())
      }}
      className={classNames(
        'flex flex-col items-center justify-center',
        'fixed inset-0 z-[10000]',
        {
          hidden: !isShowing,
          'bg-primary': background === 'primary',
          'bg-[#111] opacity-30': background === 'normal',
        }
      )}
    />,
    document.getElementById('overlay-highlight-portal')!
  )
}

export default OverlayHighlight
