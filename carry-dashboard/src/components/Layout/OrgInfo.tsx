import useCampuses from '@hooks/useCampuses'
import useOrganisationInfo from '@hooks/useOrganisationInfo'
import { useAppSelector } from '@redux/hooks'
import { Avatar } from 'antd'
import classNames from 'classnames'
import React from 'react'
import { Text } from '@components/Typography'

interface OrgInfoProps {
  isOnlyAvatar?: boolean
}

export const OrgInfo = (props: OrgInfoProps) => {
  const { isOnlyAvatar = true } = props
  const me = useAppSelector((state) => state.me)

  const { organisationInfo } = useOrganisationInfo()
  const { campuses } = useCampuses()
  const showCampus = ['campus-leader', 'campus-user'].includes(
    me.organisation.role || ''
  )
  let img: string | undefined = ''
  let name: string | undefined = ''
  if (showCampus && campuses?.length === 1) {
    img = campuses[0].image
    name = campuses[0].name
  } else {
    img = organisationInfo?.image
    name = organisationInfo?.name
  }
  return (
    <div className={classNames('mb-0 flex w-full sm:mb-10')}>
      <Avatar
        className="ml-0 h-10 w-10 sm:ml-2 sm:h-[34px] sm:w-[34px]"
        src={img}
      />
      <div className={classNames('mb-0 ml-3 mt-1 flex-1 gap-1 sm:mb-10')}>
        {!isOnlyAvatar && (
          <Text className="text-primary" strong>
            {name}
          </Text>
        )}
      </div>
    </div>
  )
}
