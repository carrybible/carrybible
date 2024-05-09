import ModalHeader from '@components/ModalHeader'
import { H2, H3 } from '@components/Typography'
import { GroupActionsType } from '@dts/groupAction'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import { Metrics, Styles } from '@shared/index'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

type ParamProps = {
  onCreate: (act: StudyPlan.Activity) => void
  onDismiss: () => void
}

type Props = StackScreenProps<{ ActivitySelectionModal: ParamProps }, 'ActivitySelectionModal'>

const ActivitySelectionModal: React.FC<Props> = props => {
  const { onDismiss, onCreate } = props.route.params
  const Analytics = useAnalytic()
  const { color } = useTheme()
  const modal = useRef<Modalize>(null)

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
      if (NavigationRoot.getCurrentScreen().name === Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_SELECTION_MODAL) {
        NavigationRoot.pop()
      }
    })
  }, [])

  const createActItemHandler = useCallback(
    (type: StudyPlan.Activity['type'], actionType?: GroupActionsType) => async () => {
      closeModal(false)
      await wait(500)
      NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_ACTIVITY_CREATION_MODAL, {
        onCreate: (act: StudyPlan.Activity) => {
          if (type === 'question') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_QUESTION_ACT)
          } else if (type === 'passage') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_READING_ACT)
          } else if (type === 'text') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_TEXT_ACT)
          } else if (type === 'video') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_VIDEO_ACT)
          } else if (type === 'action' && actionType === 'prayer') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_ACTION_PRAYER_ACT)
          } else if (type === 'action' && actionType === 'gratitude') {
            Analytics.event(Constants.EVENTS.ADVANCED_GOAL.ADD_ACTION_GRATITUDE_ACT)
          }
          return onCreate(act)
        },
        onDismiss,
        type,
        actionType,
      })
    },
    [closeModal, onCreate, onDismiss],
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
      HeaderComponent={<ModalHeader handlePosition="inside" title={I18n.t('text.Choose an activity')} style={s.header} />}
      FooterComponent={<View style={{ height: Metrics.safeArea.bottom }} />}
    >
      <View style={s.wrapper}>
        <View style={s.activityWrapper}>
          <ActItem iconText={'📖'} name={I18n.t('text.Passage')} onPress={createActItemHandler('passage')} />
          <ActItem iconText={'💬'} name={I18n.t('text.Question')} onPress={createActItemHandler('question')} />
          <ActItem iconText={'🙏'} name={I18n.t('text.Prayer')} onPress={createActItemHandler('action', 'prayer')} />
          <ActItem iconText={'🎉'} name={I18n.t('text.Gratitude')} onPress={createActItemHandler('action', 'gratitude')} />
          <ActItem iconText={'🎥'} name={I18n.t('text.Video')} onPress={createActItemHandler('video')} />
          <ActItem iconText={'📝'} name={I18n.t('text.Text')} onPress={createActItemHandler('text')} />
        </View>

        <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
          <H2 style={s.cancelText}>{I18n.t('text.Cancel')}</H2>
        </TouchableOpacity>
      </View>
    </Modalize>
  )
}

const ActItem: React.FC<{
  name: string
  iconText: string
  onPress: () => void
}> = ({ iconText, name, onPress }) => {
  const { color } = useTheme()
  return (
    <TouchableOpacity
      style={[
        s.actItem,
        {
          backgroundColor: color.background,
          borderColor: color.whiteSmoke,
        },
        color.id === 'dark' ? Styles.shadowDark : Styles.shadow,
      ]}
      onPress={onPress}
    >
      <H3>{iconText}</H3>
      <H3 style={s.name}>{name}</H3>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  wrapper: {
    alignItems: 'center',
  },
  activityWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  cancelBtn: {
    marginTop: 15,
  },
  cancelText: {
    opacity: 0.5,
  },
  actItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 0.45 * Metrics.screen.width,
    paddingVertical: 17,
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 10,
  },
  name: {
    fontWeight: '500',
    marginLeft: 4,
  },
})

export default ActivitySelectionModal
