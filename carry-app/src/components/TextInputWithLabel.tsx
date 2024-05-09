import useTheme from '@hooks/useTheme'
import Config from '@shared/Config'
import Smartlook from '@shared/Smartlook'
import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native'
import { Subheading } from './Typography'

type IProps = {
  style?: StyleProp<TextStyle>
  containerStyle?: StyleProp<ViewStyle>
  value?: string
  label?: string
  onChangeText?: (value: string) => void
  placeholder?: string
  placeholderTextColor?: string
  numberOfLines?: number
  maxLength?: number
  editable?: boolean
  returnKeyType?: TextInputProps['returnKeyType']
  onSubmitEditing?: TextInputProps['onSubmitEditing']
  keyboardType?: TextInputProps['keyboardType']
  autoFocus?: boolean
  autoCapitalize?: boolean
  placeholderWeight?: '500' | '600' | 'bold'
  otherProps?: any
  error?: boolean
}

type IRef = {
  clear: () => void
}

const TextInputWithLabel: ForwardRefRenderFunction<IRef, IProps> = (props, ref) => {
  const { numberOfLines = 0, value, editable = true, error } = props
  const [text, setText] = useState(value)
  const textRef = useRef<any>()
  const { color: theme, typography } = useTheme()

  useEffect(() => {
    Smartlook.registerWhitelistedView(textRef.current)
  }, [])

  useImperativeHandle(ref, () => ({
    clear: () => {
      setText('')
      textRef.current?.clear()
    },
  }))

  const _handleTextChanged = text => {
    setText(text)

    props.onChangeText && props.onChangeText(text)
  }

  useEffect(() => {
    if (value !== text) {
      setText(value)
    }
  }, [value])

  const renderInputText = useMemo(() => {
    const font: any = {}
    return (
      <TextInput
        {...props}
        ref={textRef}
        style={[
          styles.input,
          {
            color: theme.text,
            fontSize: typography.body,
          },
          font,
        ]}
        disableFullscreenUI={true}
        keyboardAppearance={theme.id === 'light' ? 'light' : 'dark'}
        placeholder={`${props.placeholder || ''}`}
        placeholderTextColor={props.placeholderTextColor || `${theme.text}AA`}
        value={text}
        onChangeText={_handleTextChanged}
        textAlignVertical={numberOfLines >= 2 ? 'top' : 'center'}
        multiline={false}
        numberOfLines={numberOfLines}
        onSubmitEditing={props.onSubmitEditing}
        blurOnSubmit
        returnKeyType={props.returnKeyType}
        maxLength={props.maxLength}
        keyboardType={props.keyboardType || 'default'}
        autoFocus={props.autoFocus || false}
        autoCapitalize={props.autoCapitalize || 'none'}
        editable={editable}
        {...(props.otherProps ? props.otherProps : {})}
      />
    )
  }, [text, theme.id])

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: theme.middle,
          borderColor: error ? theme.red : theme.gray3,
        },
        props.containerStyle,
      ]}>
      <Subheading color="gray3" style={styles.header}>
        {props.label}
      </Subheading>
      {renderInputText}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    height: 50,
    paddingLeft: 12,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 2,
    minHeight: 50,
  },
  header: { fontSize: 12, marginTop: -3 },
})

export default forwardRef(TextInputWithLabel)
