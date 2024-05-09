/**
 * Bottom Actions Modal
 *
 * @format
 *
 */

import Button from '@components/Button'
import { H2, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  title: string
  description: string
  confirmTitle: string
  cancelTitle: string
  onConfirm: () => void
  onCancel: () => void
  confirmColor: string
}

const BottomConfirm = (props: Props) => {
  const { title, description, confirmTitle, cancelTitle, onConfirm, onCancel, confirmColor } = props
  const { color } = useTheme()

  const chooseAction = () => {
    onConfirm()
  }
  return (
    <View style={{ marginVertical: Metrics.insets.vertical, alignItems: 'center' }}>
      <H2 bold style={{ marginVertical: 20 }}>
        {title}
      </H2>
      <Text color="gray" style={{ marginHorizontal: Metrics.insets.horizontal, textAlign: 'center', marginBottom: 15 }}>
        {description}
      </Text>
      <Button.Full
        style={{
          backgroundColor: confirmColor || color.accent,
          borderRadius: 10,
          marginHorizontal: Metrics.insets.horizontal,
          marginVertical: Metrics.insets.vertical,
        }}
        text={confirmTitle}
        textStyle={{ fontWeight: '700', color: color.white, flex: 1 }}
        onPress={chooseAction}
      />
      <Button.Full
        style={{
          borderRadius: 10,
          marginHorizontal: Metrics.insets.horizontal,
        }}
        text={cancelTitle}
        textStyle={{ fontWeight: '700', color: color.gray, flex: 1 }}
        onPress={onCancel}
      />
    </View>
  )
}

const s = StyleSheet.create({})

export default BottomConfirm
