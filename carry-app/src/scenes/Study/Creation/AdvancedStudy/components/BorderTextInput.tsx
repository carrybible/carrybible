import useTheme from '@hooks/useTheme'
import React from 'react'
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native'

const BorderTextInput = (props: TextInputProps) => {
  const { color, typography } = useTheme()

  return (
    <TextInput
      underlineColorAndroid="transparent"
      placeholderTextColor={`#828282`}
      {...props}
      style={[styles.textInput, { fontSize: typography.body, color: color.text }, props.style]}
    />
  )
}

const styles = StyleSheet.create({
  textInput: {
    marginTop: 20,
    fontWeight: '400',
    paddingLeft: 15,
    backgroundColor: '#EDEEF366',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B2B3B966',
    ...(Platform.OS === 'android' ? { paddingVertical: 0, lineHeight: 14 } : {}),
    height: Platform.OS === 'ios' ? 50 : 40,
  },
})

export default BorderTextInput
