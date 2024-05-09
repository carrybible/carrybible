import BottomButton from '@components/BottomButton'
import { H2, Title } from '@components/Typography'

import ActionSteps from '@dts/actionSteps'
import FollowUp from '@dts/followUp'

import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import { useKeyboardPadding } from '@hooks/useKeyboard'
import useTheme from '@hooks/useTheme'
import firestore from '@react-native-firebase/firestore'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Styles } from '@shared/index'
import Utils, { wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { Animated, Keyboard, Platform, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { useSelector } from 'react-redux'

type Props = {
  actionSteps: ActionSteps
  onShare?: () => void
  activity?: StudyPlan.ActionAct
}

const FollowUpCreate: React.FC<Props> = ({ actionSteps, onShare }) => {
  const { color, typography } = useTheme()
  const Analytics = useAnalytic()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const followUpPromptText = actionSteps.followUpPromptText || I18n.t('text.How did you take action and what did you learn')

  const keyboardPadding = useKeyboardPadding({
    androidEnable: true,
    ...Platform.select({
      android: {
        extraPadding: 50,
        useKeyboardHeight: false,
      },
      ios: {
        useKeyboardHeight: true,
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
    const messageId = await Utils.generateSilentMessage(group.channel, followUpPromptText)
    const data: FollowUp = {
      id: messageId,
      content: content,
      updated: firestore.FieldValue.serverTimestamp(),
      creatorInfo: {
        userId: me.uid,
        image: me.image,
        name: me.name,
      },
      viewers: [],
    }
    const { success } = await Firestore.ActionStep.createFollowUp(group.id, actionSteps.id, data)
    setLoading(false)
    if (!success) {
      toast.error(I18n.t('text.Failed to share with your group. Please try again later'))
    } else {
      Analytics.event(Constants.EVENTS.ACTIONS_STEP.SHARE_ACTION_STEP_FOLLOW_UP)
      setSubmitted(true)
      if (onShare) {
        // toast.success(I18n.t('text.Follow up created'))
        await wait(500)
        onShare()
      }
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View style={[styles.container, { transform: [{ translateY: keyboardPadding }] }]}>
        <View style={[styles.contentWrapper, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
          <View style={styles.premiumIconWrapper}>
            <View style={styles.flex1} />
          </View>
          <View style={styles.content}>
            <TitleDetail title={followUpPromptText} />

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
        <BottomButton
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            backgroundColor: 'transparent',
          }}
          title={I18n.t('text.Skip this')}
          titleStyle={[
            styles.skipBtnTitle,
            {
              color: color.gray10,
            },
          ]}
          onPress={onShare}
          avoidKeyboard={false}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const TitleDetail = ({ title }: { title?: string }) => {
  return (
    <View style={styles.titleWrapper}>
      <Title style={styles.titleIcon}>🙌</Title>
      <H2 bold align="center" style={styles.titleText}>
        {title}
      </H2>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    borderRadius: 20,
    flex: 1,
    paddingTop: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  premiumIconWrapper: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  content: {
    flex: 1,
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
    marginBottom: 40,
  },
  titleIcon: {
    marginBottom: 23,
    fontSize: 36,
  },
  titleText: {
    marginHorizontal: '10%',
  },
  skipBtnTitle: {
    fontWeight: '400',
    fontSize: 17,
  },
})

export default FollowUpCreate
