import { StudyPlan } from '@dts/study'
import GroupActionDetailViewer from '@scenes/GroupActions/components/GroupActionDetailViewer'
import React, { FC } from 'react'
import GroupActionCreate from '@scenes/GroupActions/components/GroupActionCreate'

interface Props {
  onShare?: () => void
  activity: StudyPlan.ActionAct
  groupId?: string
}

const ActivityAction: FC<Props> = ({ onShare, activity, groupId = '' }) => {
  if (!activity) return null

  return (
    <>
      {activity.action ? (
        <GroupActionDetailViewer info={activity.action} />
      ) : (
        <GroupActionCreate activity={activity} type={activity.actionType} onShare={onShare} />
      )}
    </>
  )
}

export default ActivityAction
