import BottomButton from '@components/BottomButton'
import { Footnote, H2 } from '@components/Typography'
import { RootState } from '@dts/state'
import { useOTAVersion } from '@hooks/useCodepushVersion'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import BorderTextInput from '@scenes/Study/Creation/AdvancedStudy/components/BorderTextInput'
import Config from '@shared/Config'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, InteractionManager, Platform, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSelector } from 'react-redux'

const ReportModal = props => {
  const { color } = useTheme()
  const type: 'bug' | 'feedback' = props?.route?.params?.type || 'bug'
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const modal = useRef<Modalize>(null)
  const { appVersion } = useOTAVersion()
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const organisation = useSelector<RootState, RootState['organisation']>(state => state.organisation)

  useEffect(() => {
    openModal()
  }, [])

  const onClosed = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.pop()
    })
  }, [navigation])

  const handleReport = useCallback(async () => {
    setLoading(true)
    const campusIds = me.organisation?.campusIds || []
    if (me.organisation?.campusId) {
      campusIds.push(me.organisation.campusId)
    }

    const result = await Firestore.Feedbacks.postFeedback(type, {
      message: content || '',
      uid: me.uid,

      name: me.name || '',
      email: me.email || '',
      groupId: group.id,
      groupName: group.name,
      campusIdOfGroup: group.organisation?.campusId || '',
      orgIdOfGroup: group.organisation?.id || '',
      campusIds,
      orgId: me.organisation?.id || '',
      orgName: organisation.orgInfo.name,

      appName: Config.APP_NAME,
      appVersion: appVersion,
      appPlatform: Platform.OS,
      deviceVersion: Platform.Version,
    })

    setLoading(false)

    if (result) {
      onClosed()
    }
  }, [
    appVersion,
    content,
    group.id,
    group.name,
    group.organisation?.campusId,
    group.organisation?.id,
    me.email,
    me.name,
    me.organisation?.campusId,
    me.organisation?.campusIds,
    me.organisation?.id,
    me.uid,
    onClosed,
    organisation.orgInfo.name,
    type,
  ])

  const openModal = () => {
    if (modal.current) {
      modal.current.open()
    }
  }

  return (
    <Modalize
      ref={modal}
      onClosed={onClosed}
      disableScrollIfPossible
      adjustToContentHeight
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
      }}
      handlePosition="inside"
      scrollViewProps={{ scrollEnabled: false }}
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: Metrics.insets.bottom }} />}>
      <TextContent loading={loading} type={type} onPressDone={handleReport} content={content} setContent={setContent} />
    </Modalize>
  )
}

const TextContent = ({
  onPressDone,
  content,
  setContent,
  type,
  loading,
}: {
  onPressDone: () => void
  content: string
  setContent: (string) => void
  type: 'bug' | 'feedback'
  loading: boolean
}) => {
  const { color } = useTheme()
  const headerMsg = type === 'bug' ? I18n.t('text.report_bug_header') : I18n.t('text.feedback_header')
  const contentMsg = type === 'bug' ? I18n.t('text.report_bug_content') : I18n.t('text.feedback_content', { appName: Config.APP_NAME })
  return (
    <View style={styles.flex}>
      <Animated.View style={styles.wrapper}>
        <View style={styles.descriptionWrapper}>
          <H2 style={styles.descriptionTitle}>{headerMsg}</H2>
          <Footnote style={styles.textContent}>{contentMsg}</Footnote>
        </View>
        <View style={styles.multilineInput}>
          <BorderTextInput
            placeholder={I18n.t('text.Add text here')}
            placeholderTextColor={`${color.text}50`}
            value={content}
            onChangeText={setContent}
            multiline={true}
            style={styles.biggerTextInput}
          />
        </View>
      </Animated.View>
      <BottomButton
        loading={loading}
        title={I18n.t('text.Send')}
        rounded
        onPress={onPressDone}
        avoidKeyboard={false}
        disabled={content.length === 0}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  flex: { flex: 1 },
  wrapper: {
    marginVertical: 30,
    flex: 1,
    alignItems: 'center',
  },
  descriptionWrapper: {
    alignItems: 'center',
    marginHorizontal: 30,
    marginTop: 20,
  },
  multilineInput: {
    flex: 1,
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 15,
  },
  descriptionTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  biggerTextInput: {
    height: '100%',
    paddingTop: 10,
    paddingRight: 15,
    minHeight: 100,
    maxHeight: 150,
  },
  textContent: {
    textAlign: 'center',
  },
})

export default ReportModal
