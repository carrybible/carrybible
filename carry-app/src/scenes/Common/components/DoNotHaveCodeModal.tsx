import Button from '@components/Button'

import { H1, Text } from '@components/Typography'

import useTheme from '@hooks/useTheme'
import Config from '@shared/Config'
import I18n from 'i18n-js'
import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { Image, StyleSheet, View, Linking } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface DoNotHaveCodeModalModalize {
  open?: () => void
  close?: () => void
  onPressConfirm?: () => void
}

const DoNotHaveCodeModal = (props: DoNotHaveCodeModalModalize, ref) => {
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)

  useImperativeHandle(ref, () => ({
    open: openModal,
    close: closeModal,
  }))

  const openModal = () => {
    modal.current?.open()
  }

  const closeModal = () => {
    modal.current?.close()
    props.onPressConfirm?.()
  }

  const onPressNoGroup = () => {
    modal.current?.close()
    Linking.openURL(Config.CONTACT_URL)
  }

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
      }}
      disableScrollIfPossible
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}>
      <View style={styles.contentWrapper}>
        <Image style={styles.icon} source={require('@assets/icons/ic-phone.png')} resizeMode="contain" />
        <H1 align="center" style={styles.title}>
          {I18n.t('text.No code no problem')}
        </H1>
        <Text align="center" style={styles.contentText} color="gray3">
          {I18n.t('text.No code desc')}
        </Text>
        <Button.Full
          text={I18n.t('text.Got it')}
          style={[
            styles.button,
            {
              backgroundColor: color.accent,
            },
          ]}
          textStyle={[styles.buttonConfirmText, { color: color.white }]}
          onPress={closeModal}
        />
        <Button.Full
          text={I18n.t('text.Do not have group')}
          style={[
            styles.button,
            styles.border,
            {
              backgroundColor: color.white,

              borderColor: Config.VARIANT !== 'carry' ? color.accent : color.white,
            },
          ]}
          textStyle={[styles.buttonConfirmText, { color: color.accent }]}
          onPress={onPressNoGroup}
        />
      </View>
    </Modalize>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    paddingTop: 55,
    alignItems: 'center',
  },
  border: {
    borderWidth: 2,
  },
  title: {
    marginVertical: 10,
  },
  contentText: {
    marginBottom: 35,
  },

  button: {
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonConfirmText: { fontWeight: '700', flex: 1 },
  icon: { height: 40 },
})

export default forwardRef(DoNotHaveCodeModal)
