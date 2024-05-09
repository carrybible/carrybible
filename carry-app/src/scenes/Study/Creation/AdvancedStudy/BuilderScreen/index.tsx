import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { Subheading, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import IconButton from '@scenes/Launch/components/IconButton'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import I18n from '@shared/I18n'
import Metrics from '@shared/Metrics'
import React, { useCallback, useEffect } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'

import BuilderTitle from '../components/BuilderTitle'
import { ActionItem, PassageItem, QuestionItem, TextItem, VideoItem } from './components/ActivityItems'
import { useActivitySelectionModal, useBlockData, useBuilderMoreOption } from './hook'

// eslint-disable-next-line no-unused-vars
const ActivityItemMap: { [type in StudyPlan.Activity['type']]: React.ElementType<{ item: StudyPlan.Activity }> | undefined } = {
  passage: PassageItem,
  action: ActionItem,
  text: TextItem,
  question: QuestionItem,
  video: VideoItem,
  completed: undefined,
  streak: undefined,
}

type ParamProps = {
  index: number
  name?: string
  activities?: StudyPlan.Activity[]
  onUpdateBlock: (newBlock: StudyPlan.Block) => void
  onDeleteBlock: () => void
}

type Props = StackScreenProps<{ BuilderScreen: ParamProps }, 'BuilderScreen'>

const BuilderScreen: React.FC<Props> = props => {
  const { index: blockIndex, activities: initActivities, name: initName, onUpdateBlock, onDeleteBlock, pace } = props.route.params
  const Analytics = useAnalytic()
  const { color, typography } = useTheme()
  const { block, isEdited, updateBlock, updateTitle, addActivity, updateActivity, removeActivity, validateBlock } = useBlockData({
    initActivities,
    initName,
  })

  const { addNewActivity } = useActivitySelectionModal()

  const { onPress: handleOpenMoreOption } = useBuilderMoreOption({
    onDeleteBlock,
    headerComponent: () => <Text style={s.header}>{I18n.t('text.Menu')}</Text>,
    pace,
  })

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.VIEW_STUDY_BLOCK)
  }, [Analytics])

  const handleAddActivity = useCallback(async () => {
    const activity = await addNewActivity()
    if (activity) {
      addActivity(activity)
    }
  }, [addActivity, addNewActivity])

  const handlePressDone = useCallback(() => {
    const error = validateBlock()
    if (error) {
      toast.error(error)
      return
    }
    onUpdateBlock(block)
    NavigationRoot.pop()
  }, [block, onUpdateBlock, validateBlock])

  const handlePressBack = useCallback(() => {
    if (isEdited.current) {
      NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
        title: I18n.t('text.Confirm'),
        description: I18n.t('text.back block'),
        confirmTitle: I18n.t('text.Yes continue'),
        cancelTitle: I18n.t('text.cancel'),
        confirmColor: color.gray,
        onConfirm: () => {
          NavigationRoot.pop()
        },
      })
    } else {
      NavigationRoot.pop()
    }
  }, [color.gray, isEdited])

  const renderItem = ({ item, index, drag, isActive }: RenderItemParams<StudyPlan.Activity>) => {
    const ActivityItem = ActivityItemMap[item.type]
    if (!ActivityItem) {
      return null
    }
    return (
      <ScaleDecorator>
        <TouchableOpacity
          delayLongPress={100}
          onLongPress={drag}
          onPress={() => {
            NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_CREATION_MODAL, {
              onCreate: (act: StudyPlan.Activity) => {
                updateActivity(act, index as number)
              },
              onDismiss: () => {
                // do nothing here
              },
              type: item.type,
              actionType: item.type === 'action' ? item.actionType : undefined,
              initActivity: item,
            })
          }}
          disabled={isActive}
          style={s.actItemWrapper}>
          <ActivityItem item={item} />
          <IconButton
            onPress={() => {
              removeActivity(index as number)
            }}
            icon={'x'}
            size={22}
            iconStyle={s.iconItem}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={handlePressBack}
        iconRight={'more-vertical'}
        colorRight={color.text}
        iconRightSize={22}
        onPressRight={handleOpenMoreOption}
        borderedBottom
      />

      <Subheading bold color="gray5" style={s.dayTitle}>
        {`${I18n.t(`text.${pace.charAt(0).toUpperCase() + pace.slice(1)}`)} ${blockIndex + 1}`}
      </Subheading>
      <BuilderTitle
        onUpdateTitle={updateTitle}
        initTitle={block.name}
        placeholder={I18n.t(`text.Enter ${pace} s name`)}
        fontSize={typography.h2}
      />

      <View style={s.listWrapper}>
        <DraggableFlatList
          data={block.activities}
          style={s.list}
          contentContainerStyle={s.contentContainerWrapper}
          // @ts-ignore
          renderItem={renderItem}
          onDragEnd={({ data: activities }) => updateBlock({ activities })}
          keyExtractor={(item, index) => `${index}`}
          ListEmptyComponent={
            <View style={[s.pressStart, { borderColor: color.gray7 }]}>
              <Subheading color="gray5" bold style={s.alignCenter}>
                {I18n.t(`text.Tap Add activity to start`)}
              </Subheading>
            </View>
          }
          alwaysBounceVertical={false}
        />
      </View>
      <BottomButton title={I18n.t('text. Add activity')} rounded secondary onPress={handleAddActivity} avoidKeyboard={false} />
      <BottomButton
        title={I18n.t('text.Done')}
        rounded
        onPress={handlePressDone}
        disabled={block.activities.length === 0}
        avoidKeyboard={false}
      />
    </Container>
  )
}

const s = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
  pressStart: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 7,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: 20,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  alignCenter: {
    textAlign: 'center',
  },
  actItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  iconItem: {
    opacity: 0.3,
    marginBottom: 0,
    width: 22,
    height: 22,
  },
  contentContainerWrapper: {
    paddingHorizontal: Metrics.insets.horizontal,
  },
  dayTitle: {
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: Metrics.insets.top,
    marginVertical: 15,
  },
  header: {
    fontWeight: '700',
    maxHeight: 50,
  },
  list: {
    height: '100%',
  },
})

export default BuilderScreen
