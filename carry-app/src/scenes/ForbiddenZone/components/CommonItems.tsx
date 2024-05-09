import Button from '@components/Button'
import Text from '@components/Typography/Text'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { StyleSheet, Switch, SwitchProps, TouchableOpacity, View } from 'react-native'

export const ItemSwitch: React.FC<{ title: string } & SwitchProps> = ({ title, ...props }) => {
  return (
    <View style={[styles.wrapper, styles.border]}>
      <Text numberOfLines={2}>{title}</Text>
      <Switch {...props} />
    </View>
  )
}

export const ItemButton: React.FC<{ title: string; btnTitle: string; onPress: () => void }> = ({ title, btnTitle, onPress }) => {
  const { color } = useTheme()
  return (
    <View style={[styles.wrapper, styles.border]}>
      <Text numberOfLines={2}>{title}</Text>
      <TouchableOpacity onPress={onPress} style={[styles.btnWrapper, { backgroundColor: color.accent }]}>
        <Text color="background">{btnTitle}</Text>
      </TouchableOpacity>
    </View>
  )
}

export const ItemNavigate: React.FC<{ title: string; onPress: () => void }> = ({ title, onPress }) => {
  const { color } = useTheme()
  return (
    <TouchableOpacity style={[styles.wrapper, styles.border]} onPress={onPress}>
      <Text numberOfLines={2}>{title}</Text>
      <Button.Icon icon={'chevron-thin-right'} size={22} color={color.text} onPress={onPress} font={'entypo'} style={styles.btnIcon} />
    </TouchableOpacity>
  )
}

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { color } = useTheme()
  return (
    <View style={[styles.wrapper, { backgroundColor: color.gray5 }]}>
      <Text bold numberOfLines={1}>
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'gray',
  },
  btnWrapper: {
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  btnIcon: { marginVertical: 3 },
})
