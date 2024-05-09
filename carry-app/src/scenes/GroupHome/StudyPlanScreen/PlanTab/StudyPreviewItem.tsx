import Avatar from '@components/Avatar'
import Icon from '@components/Icon'
import { Footnote, H3, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { useContext, useMemo } from 'react'
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native'

import { StudyPreviewContext } from '../context'
import ItemTask from './ItemTask'
import TaskTitle from './TaskTitle'

type IProps = {
  index: number
  expanded: boolean
  highlighted: boolean
  block: StudyPlan.Block
  onCollapse: (a: number) => void
  locked: boolean
  progress?: StudyPlan.UserProgress
}

const StudyPreviewItem = (props: IProps) => {
  const { progress, locked, index: blockIndex, block } = props
  const collapsed = !props.expanded

  const { color } = useTheme()

  const completedProfiles = useCompleteProfiles(block)

  const anim = useLayoutAnimation()
  const onPressTitle = () => {
    if (Platform.OS === 'ios') {
      anim.custom()
    }
    props.onCollapse(props.index)
  }

  return (
    <View
      style={[
        s.container,
        props.highlighted && { ...s.highlight, borderColor: color.accent },
        {
          backgroundColor: color.background,
          shadowColor: color.text,
        },
      ]}
    >
      <Header
        block={block}
        completedProfiles={completedProfiles}
        index={blockIndex}
        locked={locked}
        progress={progress}
        collapsed={collapsed}
        onPressTitle={onPressTitle}
      />
      {!collapsed && (
        <View style={s.collapseItem}>
          <Body block={block} progress={progress} />
          <Footer block={block} completedProfiles={completedProfiles} />
        </View>
      )}
    </View>
  )
}

// region ---------------------- sub components ----------------------
const Header = ({ onPressTitle, progress, index, collapsed, locked, block, completedProfiles }) => {
  const { color } = useTheme()
  const context = useContext(StudyPreviewContext)
  return (
    <TouchableOpacity style={[s.flexLayout, s.headerWrapper]} onPress={onPressTitle} activeOpacity={0.9}>
      <View style={s.headerInfo}>
        <View style={s.flexLayout}>
          {!!progress?.isCompleted && <Icon source="check-circle" color={color.accent} size={12} />}
          <Footnote
            color={collapsed ? 'gray2' : 'accent'}
            style={
              (s.paceText,
              {
                marginLeft: progress?.isCompleted ? 4 : 0,
              })
            }
          >
            {_.capitalize(I18n.t(`text.${context.plan?.pace}`))} {index + 1}
          </Footnote>
        </View>
        <Text color={locked ? 'gray2' : 'text'} style={s.blockName}>
          {block.name}
        </Text>
      </View>

      {collapsed && <UserFinished block={block} completedProfiles={completedProfiles} />}

      {locked ? (
        <Icon source="lock" color={color.gray3} size={20} />
      ) : collapsed ? (
        <Icon source="chevron-down" color={color.text} size={22} />
      ) : (
        <Icon source="chevron-up" color={color.text} size={22} />
      )}
    </TouchableOpacity>
  )
}

const Body = ({ block, progress }: { block: StudyPlan.Block; progress?: StudyPlan.UserProgress }) => {
  const groupActList = useGroupActivities(block, progress)
  return (
    <>
      {groupActList.map((act, index) => (
        <Section key={index} activity={act} />
      ))}
    </>
  )
}

const Footer = ({ block, completedProfiles }: { block: StudyPlan.Block; completedProfiles: any[] }) => {
  if (completedProfiles.length === 0) {
    return null
  }
  return (
    <TaskTitle
      style={s.footer}
      icon="users"
      title={I18n.t('text.Friends')}
      RightComponent={() => <UserFinished block={block} completedProfiles={completedProfiles} />}
    />
  )
}

const UserFinished = ({ completedProfiles, block }) => {
  const { color } = useTheme()
  return (
    <View style={s.avatars}>
      {completedProfiles.length > 3 && (
        <Text bold style={s.extendUserNumber}>
          +{(block?.completedMembers?.length || 0) - 3}
        </Text>
      )}
      {completedProfiles &&
        completedProfiles.slice(0, 3).map((user, idx) => (
          <Avatar
            disabled
            key={`u-${idx.toString()}`}
            url={user.user.image}
            size={18}
            round
            style={[
              s.userFinishAvatar,
              {
                borderColor: color.background,
              },
            ]}
          />
        ))}
    </View>
  )
}

const Section = ({ activity }: { activity: GroupActs }) => {
  const { color } = useTheme()

  const icon = useMemo(() => {
    switch (activity.type) {
      case 'action':
      case 'video':
        return <Icon source={require('@assets/icons/ic-premium.png')} size={22} color={'#FECC2F'} style={s.sectionIcon} />
      case 'passage':
        return <Icon source={'book-open'} size={22} color={color.text} style={s.sectionIcon} />
      case 'question':
        return <Icon source={'help-circle'} size={22} color={color.text} style={s.sectionIcon} />
      case 'text':
        return <Icon source={'file-text'} size={22} color={color.text} style={s.sectionIcon} />
    }
  }, [activity.type, color])

  return (
    <View>
      <View style={s.sectionHeader}>
        {icon}
        <H3>{activity.title}</H3>
        <View style={s.flex1} />
        <H3 bold={false} color="accent">
          {activity.subTitle}
        </H3>
      </View>
      <View style={s.tasksWrapper}>
        {activity.tasks.map((task, index) => (
          <ItemTask key={index} title={task.content} done={task.done} />
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
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
  highlight: {
    borderWidth: 1,
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
  headerWrapper: {
    flex: 1,
    height: 66,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  paceText: {
    fontWeight: '500',
  },
  blockName: { fontWeight: '500' },
  footer: {
    marginTop: 5,
    marginBottom: 5,
  },
  userFinishAvatar: {
    marginLeft: -8,
    opacity: 1,
    borderWidth: 1.5,
    borderRadius: 9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  sectionIcon: {
    marginRight: 12,
  },
  flex1: {
    flex: 1,
  },
  tasksWrapper: {
    marginBottom: 30,
  },
})
// endregion ---------------------- sub components ----------------------

// region ---------------------- hooks ----------------------
const useCompleteProfiles = (block: StudyPlan.Block) => {
  const context = useContext(StudyPreviewContext)
  const getCompletedProfile = React.useCallback(() => {
    return context.groupMembers?.filter(u => block?.completedMembers?.includes(u.user?.id || '')) ?? []
  }, [block?.completedMembers, context.groupMembers])
  return React.useMemo(() => getCompletedProfile(), [getCompletedProfile])
}

type GroupActs = {
  type: StudyPlan.Block['activities'][number]['type']
  title: string
  subTitle: string
  tasks: {
    content: string
    done: boolean
  }[]
}

const useGroupActivities = (block: StudyPlan.Block, progress?: StudyPlan.UserProgress): GroupActs[] => {
  return React.useMemo(() => {
    const generateTask = (act: StudyPlan.Block['activities'][number], done: boolean, index: number) => {
      if (act.type === 'question') return [{ content: act.question, done }]
      if (act.type === 'passage')
        return [{ content: `${act.chapter?.bookName} ${act.chapter?.chapterNumber}${act.verseRange ? `: ${act.verseRange}` : ''}`, done }]
      if (act.type === 'video') return [{ content: act.title, done }]
      if (act.type === 'action')
        return [
          {
            content: act.text || '',
            done,
          },
          {
            content:
              act.actionType === 'prayer' ? I18n.t('text.Pray for your group members') : I18n.t('text.Celebrate with your group members'),
            done: progress?.activities?.[index + 1]?.isCompleted || progress?.isCompleted || false,
          },
        ]
      if (act.type === 'text' && act.title) {
        return [
          {
            content: act.title,
            done,
          },
        ]
      }
      return []
    }

    const generateTitle = (act: StudyPlan.Block['activities'][number]) => {
      if (act.type === 'question') return I18n.t('text.Discussion')
      if (act.type === 'passage') return I18n.t('text.Readings')
      if (act.type === 'video') return I18n.t('text.Video')
      if (act.type === 'action') return act.actionType === 'prayer' ? I18n.t('text.Prayer') : I18n.t('text.Gratitude')
      if (act.type === 'text') return I18n.t('text.Text')
      return ''
    }

    const generateSubtitle = (act: StudyPlan.Block['activities'][number], total: number, totalDone: number) => {
      if (act.type === 'question') return `${totalDone}/${total}`
      if (act.type === 'passage') return `${totalDone}/${total}`
      if (act.type === 'video') return `${Math.round(act.duration / 60) || 1} min`
      if (act.type === 'action') return `${totalDone}/${total}`
      if (act.type === 'text') return `${totalDone}/${total}`
      return ''
    }

    if (block.activities.length === 0) return []
    const returnData: GroupActs[] = []
    let tasks: GroupActs['tasks'] = []
    block.activities.forEach((act, index) => {
      const isDone = progress?.activities?.[index]?.isCompleted || false
      tasks = [...tasks, ...generateTask(block.activities[index], isDone, index)]
      if (
        block.activities?.[index + 1]?.type !== act.type ||
        // @ts-ignore
        block.activities?.[index + 1]?.actionType !== act.actionType ||
        block.activities?.[index]?.type === 'video'
      ) {
        returnData.push({
          type: act.type,
          title: generateTitle(block.activities[index]),
          subTitle: generateSubtitle(
            act,
            tasks.length,
            tasks.reduce((pre, cur) => pre + +cur.done, 0),
          ),
          tasks,
        })
        tasks = []
      }
    })
    return returnData
  }, [block, progress])
}
// endregion

export default React.memo(StudyPreviewItem)
