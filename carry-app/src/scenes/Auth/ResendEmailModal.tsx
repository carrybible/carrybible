import React, { useEffect, useRef } from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import BottomButton from '@components/BottomButton'
import { H1, Text, Title } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import I18n from 'i18n-js'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  navigation: any
  route: any
}

const ResendEmailModal: React.FC<Props> = props => {
  const email = props.route.params?.email || ''
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)

  useEffect(() => {
    modal.current?.open()
  }, [])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      NavigationRoot.pop()
    })
  }

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      onClosed={onClosed}
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
      }}
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}>
      <View style={styles.contentWrapper}>
        <Title style={styles.mainIcon}>✉️</Title>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Resend title')}
        </H1>
        <Text align="center" style={styles.contentText} color="gray3">
          {I18n.t('text.Send des 1')}
          <Text align="center" style={styles.contentText} color="gray3" bold>
            {email}
          </Text>
          {I18n.t('text.Send des 2')}
        </Text>
        <View style={styles.bottom}>
          <BottomButton
            style={styles.bottomBtn}
            title={I18n.t('text.Got it')}
            rounded
            onPress={() => NavigationRoot.pop(2)}
            avoidKeyboard={false}
            keyboardVerticalOffset={50}
          />
        </View>
      </View>
    </Modalize>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    paddingTop: 55,
    alignItems: 'center',
  },
  mainIcon: {
    fontSize: 49,
    marginBottom: 10,
  },
  title: {
    marginBottom: 10,
  },
  contentText: {
    marginBottom: 35,
  },
  bottomBtn: {
    marginBottom: 30,
    marginHorizontal: 0,
  },
  bottom: { flex: 1, width: '100%' },
})

export default ResendEmailModal
