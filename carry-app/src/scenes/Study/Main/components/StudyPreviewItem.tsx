import Avatar from '@components/Avatar'
import Button from '@components/Button'
import Icon from '@components/Icon'
import { Footnote, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { StudyPreviewContext } from '../StudyPreviewScreen'
import ItemTask from './ItemTask'
import TaskTitle from './TaskTitle'

type IProps = {
  index: number
  expanded: boolean
  goalStatus: string
  highlighted: boolean
  block: StudyPlan.Block
  onCollapse: (a: number) => void
  onPressStart: (isRedo?: boolean) => void
  locked: boolean
  progress?: StudyPlan.UserProgress
}

const StudyPreviewItem = (props: IProps) => {
  const { color } = useTheme()
  const context = useContext(StudyPreviewContext)
  const { progress, block } = props
  const anim = useLayoutAnimation()
  const [completedProfiles, setCompletedProfiles] = useState<any>([])
  const collapsed = !props.expanded

  useEffect(() => {
    const data = getCompeletedProfile()
    setCompletedProfiles(data)
  }, [block.completedMembers])

  const getCompeletedProfile = () => {
    const completedProfiles = context.groupMembers?.filter(u => block?.completedMembers?.includes(u.user?.id || ''))
    return completedProfiles || []
  }

  const onPressTitle = () => {
    anim.custom()
    props.onCollapse(props.index)
  }

  const renderUserFinished = () => {
    return (
      <View style={s.avatars}>
        {completedProfiles.length > 3 && (
          <Text bold style={s.extendUserNumber}>
            +{(block?.completedMembers?.length || 0) - 3}
          </Text>
        )}
        {completedProfiles &&
          completedProfiles
            .slice(0, 3)
            .map((user, idx) => (
              <Avatar
                disabled
                key={`u-${idx.toString()}`}
                url={user.user.image}
                size={18}
                round
                style={[s.avatar, { borderColor: color.background }]}
              />
            ))}
      </View>
    )
  }

  return (
    <View style={[s.container, props.highlighted ? s.todayTask : {}, { backgroundColor: color.background, shadowColor: color.text }]}>
      <TouchableOpacity style={[s.flexLayout, s.touchContainer]} onPress={onPressTitle} activeOpacity={0.9}>
        <View style={s.progressContainer}>
          <View style={s.flexLayout}>
            {!!progress?.isCompleted && <Icon source="check-circle" color={color.accent} size={12} />}
            <Footnote color={collapsed ? 'gray2' : 'accent'} style={{ marginLeft: progress?.isCompleted ? 4 : 0, fontWeight: '500' }}>
              {_.capitalize(I18n.t(`text.${context.plan?.pace}`))} {props.index + 1}
            </Footnote>
          </View>
          <Text color={props.locked ? 'gray2' : 'text'} style={s.name}>
            {props.block.name}
          </Text>
        </View>
        {collapsed && renderUserFinished()}
        {props.locked ? (
          <Icon source="lock" color={color.gray3} size={20} />
        ) : collapsed ? (
          <Icon source="chevron-down" color={color.text} size={22} />
        ) : (
          <Icon source="chevron-up" color={color.text} size={22} />
        )}
      </TouchableOpacity>
      {!collapsed && (
        <View style={s.collapseItem}>
          {props.block?.activities?.map((activity, index) => {
            switch (activity.type) {
              case 'question':
                return (
                  <ItemTask
                    icon="message-circle"
                    title={activity.question}
                    color={color.purple2}
                    done={progress?.activities?.[index]?.isCompleted}
                  />
                )
              case 'passage':
                return (
                  <ItemTask
                    icon="book-open"
                    title={`${activity.chapter?.bookName} ${activity.chapter?.chapterNumber}${
                      activity.verseRange ? `: ${activity.verseRange}` : ''
                    }`}
                    done={progress?.activities?.[index]?.isCompleted}
                  />
                )
            }
          })}
          {progress?.isCompleted // is completed, need check history
            ? context.plan?.status != 'ended' && (
                <Button.Full
                  text={
                    context.plan?.pace === 'day'
                      ? I18n.t('text.Redo day', {
                          day: props.index + 1,
                        })
                      : I18n.t('text.Redo week')
                  }
                  onPress={() => props.onPressStart(true)}
                  style={{ backgroundColor: color.gray7, ...s.actionButton }}
                  textStyle={[
                    {
                      color: color.gray3,
                    },
                    s.btnRedo,
                  ]}
                />
              )
            : props.goalStatus != 'ended' && (
                <Button.Full
                  disabled={props.locked}
                  text={I18n.t('text.Jump in')}
                  onPress={props.onPressStart}
                  style={{
                    backgroundColor: props.locked ? color.gray5 : color.accent,
                    ...s.actionButton,
                  }}
                  textStyle={{
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: 17,
                    textAlign: 'center',
                  }}
                />
              )}
          <TaskTitle
            style={s.title}
            icon="users"
            title={I18n.t('text.Completed')}
            RightComponent={() => {
              return renderUserFinished()
            }}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  footnote: { fontWeight: '500' },
  ajustLeft: { marginLeft: 4 },
  avatar: { marginLeft: -8, opacity: 1, borderWidth: 1.5, borderRadius: 9 },
  touchContainer: { flex: 1, height: 66 },
  progressContainer: { flex: 1, justifyContent: 'center' },
  name: { fontWeight: '500' },
  container: {
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: Metrics.insets.vertical,
    borderRadius: 10,
    ...Styles.shadow,
    marginBottom: 14,
    marginHorizontal: 5,
    minHeight: 66,
  },
  flexLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayTask: {
    borderColor: '#7199FE',
    borderWidth: 2,
  },
  collapseItem: {
    marginTop: 0,
  },
  avatars: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 3,
  },
  extendUserNumber: {
    color: '#828282',
    fontSize: 12,
    marginRight: 8,
  },
  actionButton: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 8,
  },
  btnRedo: { fontWeight: 'bold', fontSize: 17, textAlign: 'center' },
  btnJump: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  title: { marginTop: 5, marginBottom: 5 },
})

export default React.memo(StudyPreviewItem)
