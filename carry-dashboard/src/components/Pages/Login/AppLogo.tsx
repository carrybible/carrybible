import CarryAppIcon from '@assets/icons/CarryAppIcon'
import classNames from 'classnames'
import React from 'react'

const AppLogo = () => (
  <div
    className={classNames(
      'mb-10 flex flex-row items-center justify-center gap-1'
    )}
  >
    <CarryAppIcon colorClass="fill-neutral-10" />
    <span className="!font-['Poppins-SemiBold'] text-[36px] font-bold leading-[54px] text-neutral-10">
      Carry
    </span>
  </div>
)
export default AppLogo
