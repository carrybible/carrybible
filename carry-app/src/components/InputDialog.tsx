/**
 * Input Modal
 *
 * @format
 *
 */

import React, { useImperativeHandle, useState } from 'react'
import { StyleSheet, View, TextInput } from 'react-native'
import Modal from 'react-native-modal'
import useTheme from '@hooks/useTheme'
import { H2 } from '@components/Typography'
import Button from '@components/Button'

interface Props {
  title: string
  placeholder: string
  okText?: string
  cancelText?: string
  onOkPress: (val: string) => void
}

export interface InputModalRef {
  open: () => void
  close: () => void
}

const InputDialog: React.ForwardRefRenderFunction<InputModalRef, Props> = (props, ref) => {
  const { color: theme, typography } = useTheme()
  const [isModalVisible, setModalVisible] = useState(false)
  const [text, setText] = useState('')

  useImperativeHandle(ref, () => ({
    open: () => {
      setText('')
      setModalVisible(true)
    },
    close: () => setModalVisible(false),
  }))

  const cancelInputModal = () => {
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
        <H2 bold>{props.title}</H2>
        <TextInput
          value={text}
          onChangeText={t => setText(t)}
          placeholder={props.placeholder}
          placeholderTextColor={`${theme.text}99`}
          style={{
            marginTop: 20,
            fontSize: typography.body,
            fontWeight: '500',
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingBottom: 8,
            borderBottomColor: theme.gray5,
            color: theme.text,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
          <Button.Full
            text={props.okText || 'OK'}
            style={{ flex: 1, height: 40 }}
            textStyle={{ fontWeight: 'bold', color: theme.accent }}
            onPress={() => props.onOkPress(text)}
          />
          <Button.Full
            text={props.cancelText || 'Cancel'}
            textStyle={{ fontWeight: '500', color: theme.gray2 }}
            style={{ flex: 1, height: 40 }}
            onPress={cancelInputModal}
          />
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({})

export default React.forwardRef(InputDialog)
