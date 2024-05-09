/**
 * Custom Questioon
 *
 * @format
 *
 */

import Icon from '@components/Icon'
import TextField from '@components/TextField'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import React, { useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import I18n from 'i18n-js'

interface Props {
  editable: boolean
  onSubmit: (text: string) => void
}

const CustomQuestion: React.FC<Props> = props => {
  const customQuestionRef = useRef<any>()
  const customText = useRef<string>('')

  const [canSubmit, setCanSubmit] = useState(false)
  const [focused, setFocused] = useState(false)

  const { color: theme } = useTheme()

  return (
    <View
      style={[
        s.customButtonContainer,
        {
          borderColor: props.editable ? theme.accent : theme.gray5,
          backgroundColor: theme.background,
        },
      ]}
    >
      <TextField
        ref={customQuestionRef}
        id="custom"
        label={I18n.t('text.Custom question')}
        // value={customText}
        numberOfLines={1}
        multiline={false}
        onChangeText={(id, text) => {
          customText.current = text
          setCanSubmit(text.length > 5)
        }}
        editable={props.editable}
        onSubmitEditing={({ nativeEvent: { text } }) => {
          props.onSubmit(text)

          customText.current = ''
          customQuestionRef.current.clear()
        }}
        style={[
          s.textField,
          {
            backgroundColor: theme.background,
          },
        ]}
        otherProps={{
          onFocus: () => {
            setFocused(true)
          },
          onBlur: () => {
            setFocused(false)
          },
        }}
        maxLength={150}
        // returnKeyType="done"
      />
      <TouchableOpacity
        disabled={!canSubmit}
        style={[
          s.plusButton,
          {
            backgroundColor: canSubmit && focused ? `${theme.accent}` : theme.gray7,
          },
        ]}
        onPress={() => {
          if (!canSubmit) return
          props.onSubmit(customText.current)

          customText.current = ''
          customQuestionRef.current.clear()
        }}
      >
        <Icon size={24} source="plus" color={canSubmit && focused ? theme.white : theme.gray} />
      </TouchableOpacity>
    </View>
  )
}

CustomQuestion.defaultProps = {}

const s = StyleSheet.create({
  textField: {
    flex: 1,
    fontWeight: 'normal',
    backgroundColor: 'transparent',
    // borderWidth: 0,
    borderWidth: 0,
    maxWidth: Metrics.screen.width - Metrics.insets.horizontal * 2 - 55,

    minWidth: Metrics.screen.width - 80,
  },
  customButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    borderWidth: 1,
    marginBottom: 15,
    // justifyContent: 'space-between',
  },
  plusButton: { position: 'absolute', right: 10, borderRadius: 5, padding: 4, marginRight: 0 },
})

export default CustomQuestion
