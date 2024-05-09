import MemberInGroupAvatar from '@components/MemberInGroupAvatar'
import { Footnote, Text } from '@components/Typography'
import ActionSteps, { ActionStepStatus } from '@dts/actionSteps'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { Constants, Metrics, Styles } from '@shared/index'
import { isAfter } from 'date-fns'
import I18n from 'i18n-js'
import React, { FC, useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

interface Props {
  unread: number
  item: ActionSteps
}

const StepStatus: FC<{ actionStepStatus: ActionStepStatus; isCompleted: boolean }> = ({ actionStepStatus, isCompleted }) => {
  const { color } = useTheme()
  let statusConfig = { text: { color: color.gray }, backgroundColor: color.lavender, title: '' }

  // Action step only has 2 status (active/expired) but we need to generate to 3 status
  // - Active: action step is active and current user didn't complete it
  // - Completed: current user completed it
  // - To do: action step is expired (or toDate < now) and current user didn't complete it
  const status = useMemo<'active' | 'completed' | 'todo'>(() => {
    if (isCompleted) {
      return 'completed'
    }
    if (actionStepStatus === 'active') {
      return 'active'
    }

    return 'todo'
  }, [actionStepStatus, isCompleted])

  switch (status) {
    case 'active':
      statusConfig = { text: { color: color.white }, backgroundColor: color.accent, title: I18n.t('text.Active') }
      break
    case 'completed':
      statusConfig = { text: { color: color.gray2 }, backgroundColor: color.blue0, title: I18n.t('text.Completed') }
      break
    case 'todo':
      statusConfig = { text: { color: color.white }, backgroundColor: color.gray4, title: I18n.t('text.Todo') }
      break
    default:
      return null
  }

  return (
    <View style={[s.status, { backgroundColor: statusConfig.backgroundColor }]}>
      <Footnote style={statusConfig.text}>{statusConfig.title}</Footnote>
    </View>
  )
}

const ActionStepItem: FC<Props> = props => {
  const { item, unread = 0 } = props
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)

  const onPress = () => {
    NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.FOLLOW_UP_LISTING, { actionSteps: item })
  }

  const isCompleted = useMemo(() => item.completedMembers.includes(me.uid), [item.completedMembers, me.uid])

  const footText = unread === 0 ? `${item.completedMembers.length} completions` : `${unread} new completions`
  return (
    <TouchableOpacity style={[s.container, { backgroundColor: color.middle }]} onPress={onPress}>
      <View style={s.row}>
        <View style={s.column}>
          <StepStatus
            actionStepStatus={isAfter(Date.now(), item.toDate?.toMillis?.()) ? 'expired' : item.status}
            isCompleted={isCompleted}
          />
          <View style={s.titleContainer}>
            <Text style={s.title}>{item.actionText}</Text>
          </View>
        </View>
        {unread > 0 && (
          <View style={s.dotContainer}>
            <View style={[s.dot, { backgroundColor: color.accent }]} />
          </View>
        )}
      </View>
      {item?.followUpMembers?.length ? (
        <View style={[s.row, s.footer]}>
          <MemberInGroupAvatar members={item?.followUpMembers || []} style={s.listAvatars} avatarSize={21} />
          {item.followUpCount ? <Footnote color={unread === 0 ? 'gray2' : 'accent'}>{footText}</Footnote> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: Metrics.insets.vertical,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: Metrics.insets.horizontal,
    ...Styles.shadow,
  },
  titleContainer: { flexWrap: 'wrap', flexDirection: 'row', marginRight: 8, width: Metrics.screen.width - 80 },
  title: {
    marginTop: 13.5,
    fontWeight: '500',
  },
  status: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flex: 0,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  dotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  listAvatars: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 8,
  },
})

export default ActionStepItem
