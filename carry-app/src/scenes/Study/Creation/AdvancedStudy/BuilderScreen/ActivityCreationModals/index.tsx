import { GroupActionsType } from '@dts/groupAction'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { Constants, Metrics } from '@shared/index'
import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, InteractionManager, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import ActionPromptModal from './ActionPromptModal'
import PassageModal from './PassageModal'
import QuestionModal from './QuestionModal'
import TextModal from './TextModal'
import VideoModal from './VideoModal'

type ParamProps = {
  onCreate: (act: StudyPlan.Activity) => void
  onDismiss: () => void
  type: StudyPlan.Activity['type']
  initActivity?: StudyPlan.Activity
  actionType?: GroupActionsType
}

type Props = StackScreenProps<{ ActivityCreationModal: ParamProps }, 'ActivityCreationModal'>

const ActivityCreationModal: React.FC<Props> = props => {
  const { onCreate, onDismiss, type, initActivity, actionType } = props.route.params
  const modal = useRef<Modalize>(null)
  const { color } = useTheme()

  const openModal = useCallback(() => {
    modal.current?.open()
  }, [])

  const closeModal = useCallback(
    (shouldTriggerOnDismiss = true) => {
      if (shouldTriggerOnDismiss) {
        onDismiss()
      }
      modal.current?.close()
    },
    [onDismiss],
  )

  const onClosed = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      if (NavigationRoot.getCurrentScreen().name === Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_CREATION_MODAL) {
        NavigationRoot.pop()
      }
    })
  }, [])

  const handleCreate = useCallback(
    (act: StudyPlan.Activity) => {
      closeModal(false)
      return onCreate(act)
    },
    [closeModal, onCreate],
  )

  useEffect(() => {
    openModal()
  }, [openModal])

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      onClosed={onClosed}
      onOverlayPress={onDismiss}
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
      }}
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: Metrics.safeArea.bottom }} />}
      customRenderer={
        <Animated.View>
          {type === 'passage' && (
            <PassageModal onCreate={handleCreate} onDismiss={onDismiss} initActivity={initActivity as StudyPlan.PassageAct} />
          )}
          {type === 'question' && (
            <QuestionModal onCreate={handleCreate} onDismiss={onDismiss} initActivity={initActivity as StudyPlan.QuestionAct} />
          )}
          {type === 'video' && (
            <VideoModal onCreate={handleCreate} onDismiss={onDismiss} initActivity={initActivity as StudyPlan.VideoAct} />
          )}
          {type === 'text' && <TextModal onCreate={handleCreate} onDismiss={onDismiss} initActivity={initActivity as StudyPlan.TextAct} />}
          {type === 'action' && actionType && (
            <ActionPromptModal
              onCreate={handleCreate}
              onDismiss={onDismiss}
              initActivity={initActivity as StudyPlan.ActionAct}
              actionType={actionType}
            />
          )}
        </Animated.View>
      }
    />
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
})

export default ActivityCreationModal
