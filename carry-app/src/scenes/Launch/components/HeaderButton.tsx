/**
 * Create Space Item
 *
 * @format
 */

import React, { Fragment } from 'react'
import { Image, ImageProps, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import I18n from 'i18n-js'

type IProps = {
  onPress?: () => void
  text: string
  icon: ImageProps
  line?: boolean
}

const HeaderButton = (props: IProps) => {
  const { color: theme } = useTheme()
  return (
    <Fragment>
      <TouchableOpacity style={s.container} activeOpacity={0.8} onPress={props.onPress}>
        <View style={{ ...s.add, backgroundColor: theme.accent }}>
          <Image source={props.icon} style={{ width: 24, height: 24, tintColor: theme.white }} />
        </View>
        <Text bold>{props.text}</Text>
      </TouchableOpacity>
      {props.line ? <View style={{ ...s.line, backgroundColor: `${theme.gray5}44` }} /> : null}
    </Fragment>
  )
}
// I18n.t('text.Create group') require('@assets/icons/ic-plus.png')
HeaderButton.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
  },
  line: {
    marginVertical: 5,
    height: StyleSheet.hairlineWidth,
  },
  add: {
    height: 54,
    width: 54,
    borderRadius: 27,
    marginHorizontal: 3,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default HeaderButton
