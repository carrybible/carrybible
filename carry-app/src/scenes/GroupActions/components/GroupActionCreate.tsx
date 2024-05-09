import BottomButton from '@components/BottomButton'
import { H2, Title } from '@components/Typography'
import { GroupActionsType } from '@dts/groupAction'
import { ScoreDailyActionType } from '@dts/score'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Styles } from '@shared/index'
import { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { Animated, Keyboard, Platform, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { useSelector } from 'react-redux'

type Props = {
  type: GroupActionsType
  onShare?: () => void
  activity?: StudyPlan.ActionAct
}

const GroupActionCreate: React.FC<Props> = ({ type, onShare, activity }) => {
  const { color, typography } = useTheme()
  const Analytics = useAnalytic()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const [currentActivity] = useState<StudyPlan.ActionAct | undefined>(activity)
  const keyboardPadding = useKeyboardPadding({
    androidEnable: true,
    ...Platform.select({
      android: {
        extraPadding: 50,
        useKeyboardHeight: false,
      },
      ios: {
        extraPadding: 150,
        useKeyboardHeight: false,
      },
    }),
  })
  const [content, setContent] = React.useState('')
  const [submitted, setSubmitted] = React.useState(false)
  const [loading, setLoading] = useState(false)
  const handleCreateGroupAction = async () => {
    Keyboard.dismiss()
    if (submitted) {
      return
    }
    if (!content) {
      toast.error(I18n.t('text.Your content is empty'))
      return
    }
    setLoading(true)
    const actionData = { groupId: group.id, type, content }
    if (currentActivity?.requestText) actionData.requestText = currentActivity.requestText
    const { success } = await Firestore.GroupActions.create(actionData)
    setLoading(false)
    if (!success) {
      toast.error(I18n.t('text.Failed to share with your group. Please try again later'))
    } else {
      setSubmitted(true)
      type === 'prayer' && Analytics.event(Constants.EVENTS.GROUP.PRAYER_REQUEST)
      type === 'gratitude' && Analytics.event(Constants.EVENTS.GROUP.GRATITUDE_REQUEST)
      Firestore.Group.updateScore(
        type === 'prayer' ? ScoreDailyActionType.CREATE_PRAYER_ACTION : ScoreDailyActionType.CREATE_GRATITUDE_ACTION,
        group.id,
      )
      if (onShare) {
        toast.success(type === 'prayer' ? I18n.t('Prayer sent') : I18n.t('Gratitude sent'))
        await wait(500)
        onShare()
      }
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View style={[styles.container, { transform: [{ translateY: keyboardPadding }] }]}>
        <View style={{ ...styles.contentWrapper, backgroundColor: color.id === 'light' ? color.white : color.black }}>
          <TitleDetail type={type} title={currentActivity?.text} />

          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: color.whiteSmoke,
                backgroundColor: color.background,
                ...(color.id === 'light' ? Styles.shadow : Styles.shadowDark),
              },
            ]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: color.text,
                  fontSize: typography.h3,
                },
              ]}
              onChangeText={setContent}
              maxLength={500}
              multiline
              autoFocus={false}
              placeholder={I18n.t('text.Respond here')}
              placeholderTextColor={color.gray4}
              editable={!submitted}
            />
          </View>
        </View>

        <BottomButton
          title={I18n.t('text.Share with your group')}
          onPress={handleCreateGroupAction}
          style={[
            styles.shareBtn,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              backgroundColor: color.accent,
              opacity: submitted ? 0.5 : 1,
            },
          ]}
          loading={loading}
          avoidKeyboard={false}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const TitleDetail = ({ type, title }: { type: 'prayer' | 'gratitude'; title?: string }) => {
  return (
    <View style={styles.titleWrapper}>
      <Title style={styles.titleIcon}>{type === 'prayer' ? '🙏' : '🎉'}</Title>
      <H2 bold align="center" style={styles.titleText}>
        {title ||
          (type === 'prayer' ? I18n.t('text.What do you need prayer for today') : I18n.t('text.What are you thankful to God for today'))}
      </H2>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    // marginBottom: 16,
  },
  contentWrapper: {
    borderRadius: 20,
    flex: 1,
    paddingTop: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    paddingTop: 15,
    paddingBottom: 15,
    flex: 1,
    fontWeight: '400',
    paddingHorizontal: 20,
    height: 110,
  },
  shareBtn: {
    marginHorizontal: 0,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleIcon: {
    marginBottom: 23,
    fontSize: 36,
  },
  titleText: {
    marginHorizontal: '10%',
  },
})

export default GroupActionCreate
