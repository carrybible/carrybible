/**
 * Modal Header Component
 *
 * @format
 */

import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Button, { IconButtonProps } from '@components/Button'
import { H2, Text } from '@components/Typography'
import { Metrics } from '@shared/index'
import useTheme from '@hooks/useTheme'

type IProps = {
  title?: string
  TitleComponent?: any
  onClosePress?: () => void
  rightButtonProps?: IconButtonProps
  style?: StyleProp<ViewStyle>
  headerStyle?: StyleProp<ViewStyle>
  handlePosition: 'inside' | 'outside'
}

const ModalHeader = (props: IProps) => {
  const { color } = useTheme()
  return (
    <View
      style={[
        s.modal__header,
        { borderBottomColor: `${color.text}25`, marginTop: props.handlePosition === 'inside' ? 10 : 0 },
        props.style,
      ]}
    >
      {props.rightButtonProps && <Button.Icon style={s.modal__rightComponent} {...props.rightButtonProps} />}
      {props.TitleComponent ? props.TitleComponent() : <H2 style={[s.modal__headerText, props.headerStyle]}>{props.title}</H2>}

      {props.onClosePress && (
        <Button.Icon
          icon="x"
          color={color.text}
          size={26}
          onPress={props.onClosePress}
          style={s.modal__headerClose}
          hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
        />
      )}
    </View>
  )
}

ModalHeader.defaultProps = {
  onClose: undefined,
  title: '-',
}

const s = StyleSheet.create({
  modal__header: {
    height: 60,
    paddingHorizontal: Metrics.insets.horizontal,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modal__headerText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  modal__headerClose: {
    position: 'absolute',
    top: 3,
    right: 15,
    bottom: 0,
    zIndex: 1,
  },
  modal__rightComponent: {
    position: 'absolute',
    top: 0,
    right: 15,
    bottom: 0,
    zIndex: 1,
  },
})

export default ModalHeader
