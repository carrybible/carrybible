import { AnimatedCircularProgress } from '@components/AnimatedCircularProgress'
import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import { Footnote, H2, Subheading } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useCallback, useContext, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import { App } from '@dts/app'
import { StudyPreviewContext } from './context'

const STEP_SIZE = 36
const RADIUS = Math.min(Metrics.screen.width * 0.55, 210) / 2
const perimeter = Math.PI * 2 * (RADIUS - 4)
const gap = 40
const circleLength = perimeter - gap

const GoalDescription: React.FC<any> = ({ label, description, users, completedUsers }) => {
  const completedProfiles = users?.filter(u => completedUsers?.includes(u.user?.id || '-'))
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const completed = completedUsers?.includes(me.uid || '-')
  const { color } = useTheme()

  const renderUserFinished = () => {
    return (
      <View style={s.avatars}>
        {completedProfiles &&
          completedProfiles
            .slice(0, 3)
            .map((user: any, idx: number) => (
              <Avatar
                key={idx.toString()}
                url={user.user.image}
                size={18}
                round
                style={[s.avatarUserFinish, { borderColor: color.background }]}
              />
            ))}
        {completedProfiles && completedProfiles.length > 3 && (
          <Footnote color="gray" bold style={s.moreUserFootNote}>
            +{completedUsers.length - 3}
          </Footnote>
        )}
      </View>
    )
  }

  return (
    <View style={s.progressContent}>
      <View>
        <H2 style={s.labelText} numberOfLines={2}>
          {label}
        </H2>
      </View>
      <View style={s.contentWrapper}>
        <Subheading bold color={'accent'}>
          {description}
        </Subheading>
        {completed && <Icon style={s.iconCheck} source="check-circle" color={color.accent} size={18} />}
      </View>
      {renderUserFinished()}
    </View>
  )
}

const StudyPreviewProgress = () => {
  const context = useContext(StudyPreviewContext)
  const user = useSelector<any, App.User>(state => state.me)
  const { color } = useTheme()

  const percent = useMemo(() => {
    if (!user || !context.plan || !context.plan.memberProgress) return 0
    return context.plan.memberProgress?.[user.uid]?.percent || 0
  }, [user, context?.plan])

  // Handle sync data of group when have update
  const progressContent = useMemo(() => {
    return (
      <GoalDescription
        label={context.plan?.name}
        description={I18n.t('text.percent complete', {
          percentValue: Math.round(percent),
        })}
        users={context.groupMembers}
        completedUsers={context.completedMembers}
      />
    )
  }, [context.plan, percent, context.completedMembers, context.groupMembers])

  const pos = useCallback((index, stepCount) => {
    const arrayIndex = index - 1
    const anglePerItem = 360 / stepCount
    const angle = -anglePerItem + gap / 2 - anglePerItem * arrayIndex
    const angleInRadians = (angle * Math.PI) / 180.0
    return {
      bottom: RADIUS + (RADIUS - 5) * Math.cos(angleInRadians) - STEP_SIZE / 2,
      right: RADIUS + (RADIUS - 5) * Math.sin(angleInRadians) - STEP_SIZE / 2,
    }
  }, [])

  const progress = useMemo(() => {
    return (
      <View>
        <AnimatedCircularProgress
          size={RADIUS * 2}
          width={8}
          backgroundColor={color.gray7}
          tintColor={color.accent2}
          useNativeDriver={false}
          fill={(Math.round(percent), 100)}
          dashedBackground={[circleLength, gap]}
          dashedTint={[circleLength * (percent / 100), gap + (circleLength - circleLength * (percent / 100))]}
          lineCap="round"
        />
        <View
          key={1}
          style={[s.whiteCirle, s.activedIcon, { backgroundColor: color.accent2 }, pos(circleLength * (percent / 100) + gap, perimeter)]}>
          <Avatar url={user.image} size={30} name={user.name} />
        </View>
      </View>
    )
  }, [percent, user])

  return (
    <View style={s.progressContainer}>
      {progress}
      {progressContent}
    </View>
  )
}

const s = StyleSheet.create({
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    paddingBottom: 5,
  },
  progressContent: {
    height: RADIUS * 2,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteCirle: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  activedIcon: {
    position: 'absolute',
    backgroundColor: '#7199FE',
  },
  avatars: {
    display: 'flex',
    flexDirection: 'row',
  },
  avatarUserFinish: {
    marginRight: -5,
    borderWidth: 1,
    borderRadius: 10,
  },
  moreUserFootNote: {
    marginLeft: 8,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 5,
  },
  labelText: {
    maxWidth: '65%',
    textAlign: 'center',
  },
  iconCheck: {
    marginLeft: 5,
  },
})

export default StudyPreviewProgress
