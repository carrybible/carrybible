import { InteractionManager, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { Modalize } from 'react-native-modalize'

import { NavigationRoot } from '@scenes/root'
import useTheme from '@hooks/useTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GroupInviteLink from '@components/GroupInviteLink'
import { H1, H3, Text, Title } from '@components/Typography'
import I18n from 'i18n-js'

const ShareGroupModal: React.FC = () => {
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
        <Title style={styles.mainIcon}>👍</Title>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Invite your friends ')}
        </H1>
        <Text align="center" style={styles.contentText} color="gray3">
          {I18n.t('text.Share the link below to invite your friends to join your group')}
        </Text>
        <GroupInviteLink />
        <TouchableOpacity
          style={styles.buttonText}
          onPress={() => {
            modal.current?.close()
          }}>
          <H3 color="gray3" bold>
            {I18n.t('text.Maybe later')}
          </H3>
        </TouchableOpacity>
      </View>
    </Modalize>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 38,
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
    width: '75%',
  },
  buttonText: {
    marginTop: 20,
    marginBottom: 20,
  },
})

export default ShareGroupModal
