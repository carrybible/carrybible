/**
 * Confirm Modal
 *
 * @format
 *
 */

import React, { useImperativeHandle, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Modal from 'react-native-modal'
import useTheme from '@hooks/useTheme'
import { H2, Text } from '@components/Typography'
import Button from '@components/Button'
import I18n from 'i18n-js'

interface Props {
  title: string
  message: string
  okText?: string
  cancelText?: string
  onOkPress: () => void
}

export interface ConfirmDialogRef {
  open: () => void
  close: () => void
}

const ConfirmDialog: React.ForwardRefRenderFunction<ConfirmDialogRef, Props> = (props, ref) => {
  const { color: theme, typography } = useTheme()
  const [isModalVisible, setModalVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => setModalVisible(true),
    close: () => setModalVisible(false),
  }))

  const cancelModal = () => {
    setModalVisible(false)
  }

  return (
    <Modal isVisible={isModalVisible} onBackdropPress={() => setModalVisible(false)} avoidKeyboard>
      <View
        style={{
          backgroundColor: theme.background,
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 10,
          width: 340,
          alignSelf: 'center',
        }}
      >
        <H2 bold style={{ marginBottom: 10 }} align="center">
          {props.title}
        </H2>
        <Text align="center">{props.message}</Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 30,
            paddingTop: 10,
            borderTopColor: theme.gray2,
            borderTopWidth: StyleSheet.hairlineWidth,
            marginHorizontal: -20,
          }}
        >
          <Button.Full
            text={props.okText || I18n.t('text.OK')}
            style={{ flex: 1, height: 40, borderRightColor: theme.gray2, borderRightWidth: StyleSheet.hairlineWidth }}
            textStyle={{ fontWeight: 'bold', color: theme.accent }}
            onPress={() => props.onOkPress()}
          />
          <Button.Full
            text={props.cancelText || I18n.t('text.Cancel')}
            textStyle={{ fontWeight: '500', color: theme.gray2 }}
            style={{ flex: 1, height: 40 }}
            onPress={cancelModal}
          />
        </View>
      </View>
    </Modal>
  )
}

export default React.forwardRef(ConfirmDialog)
