import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { Modalize } from 'react-native-modalize'

import useTheme from '@hooks/useTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { H1, H3, Text, Title } from '@components/Typography'
import I18n from 'i18n-js'
import Button from '@components/Button'

export interface OverlappedPlanModalize {
  open?: (type: 'current' | 'future') => void
  close?: () => void
  onPressConfirm: () => void
  onPressCancel: () => void
}

const OverlappedPlanModal = (props: OverlappedPlanModalize, ref) => {
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const [desc, setDesc] = useState('')

  useImperativeHandle(ref, () => ({
    open: openModal,
    close: closeModal,
  }))

  const openModal = type => {
    if (type === 'current') {
      setDesc(I18n.t('text.Your selected start date overlaps with your current study. Do you want to replace your current study'))
    } else {
      setDesc(I18n.t('text.Your selected start date overlaps with a future study. Do you want to replace that future study'))
    }
    modal.current?.open()
  }

  const closeModal = () => modal.current?.close()

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
      }}
      useNativeDriver
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}
    >
      <View style={styles.contentWrapper}>
        <Title style={styles.mainIcon}>✋</Title>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Just checking')}
        </H1>
        <Text align="center" style={styles.contentText} color="gray3">
          {desc}
        </Text>
        <Button.Full
          text={I18n.t('Yes replace it')}
          style={[
            styles.button,
            {
              backgroundColor: color.accent,
            },
          ]}
          textStyle={[styles.buttonConfirmText, { color: color.white }]}
          onPress={props.onPressConfirm}
        />
        <TouchableOpacity
          style={styles.buttonText}
          onPress={() => {
            modal.current?.close()
            props.onPressCancel()
          }}
        >
          <H3 color="gray3" bold>
            {I18n.t('text.Cancel')}
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
    paddingHorizontal: 16,
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
  buttonText: {
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    borderRadius: 10,
  },
  buttonConfirmText: { fontWeight: '700', flex: 1 },
})

export default forwardRef(OverlappedPlanModal)
