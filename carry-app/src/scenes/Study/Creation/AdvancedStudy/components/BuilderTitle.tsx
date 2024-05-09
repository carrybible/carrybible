import Icon from '@components/Icon'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import React, { FC, useCallback, useRef, useState } from 'react'
import { Platform, StyleSheet, TextInput, View } from 'react-native'

const BuilderTitle: FC<{
  onUpdateTitle: (title: string) => void
  initTitle: string
  placeholder: string
  fontSize: number
}> = ({ onUpdateTitle, initTitle, placeholder, fontSize }) => {
  const { color } = useTheme()
  const [isFocus, setFocus] = useState(false)
  const [text, setText] = useState<string>(initTitle)

  const syncTextTimeout = useRef<null | ReturnType<typeof setTimeout>>(null)
  const handleOnChangeText = useCallback(
    (newText: string) => {
      setText(newText)
      if (syncTextTimeout.current) {
        clearTimeout(syncTextTimeout.current)
      }
      syncTextTimeout.current = setTimeout(() => {
        onUpdateTitle(newText)
      }, 150)
    },
    [onUpdateTitle],
  )

  return (
    <View style={s.container}>
      <TextInput
        style={[s.textInputStyle, { color: color.text, fontSize }, isFocus ? {} : s.maxHeight]}
        onBlur={() => {
          onUpdateTitle(text)
          setFocus(false)
        }}
        placeholder={placeholder}
        placeholderTextColor={`${color.text}80`}
        value={text}
        onChangeText={handleOnChangeText}
        scrollEnabled={false}
        multiline={true}
        numberOfLines={1}
        returnKeyType={'done'}
        blurOnSubmit
        maxLength={200}
        onFocus={() => {
          setFocus(true)
        }}
      />
      <Icon source="edit-2" color={color.gray5} size={20} style={s.icon} />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Metrics.insets.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  textInputStyle: {
    fontWeight: '700',
    paddingTop: Platform.OS === 'android' ? undefined : 0,
    minWidth: Metrics.screen.width * 0.5,
    textAlignVertical: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: Metrics.screen.width * 0.7,
  },
  icon: {
    marginHorizontal: 10,
  },
  maxHeight: { maxHeight: 100 },
})

export default BuilderTitle
