/* eslint-disable react-native/no-inline-styles */
/**
 * TextField - Butt Bird style
 *
 * @format
 */

import useTheme from '@hooks/useTheme'
import Config from '@shared/Config'
import Smartlook from '@shared/Smartlook'
import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Subheading, Text } from './Typography'

type IProps = {
  leftComponent?: any
  rightComponent?: any
  style?: StyleProp<TextStyle>
  containerStyle?: StyleProp<ViewStyle>
  id?: string
  value?: string
  label?: string
  onChangeText?: (id: string, value: string) => void
  placeholder?: string
  message?: string
  messageType?: 'info' | 'error' | 'count'
  placeholderTextColor?: string
  numberOfLines?: number
  multiline?: boolean
  maxLength?: number
  editable?: boolean
  rich?: boolean
  returnKeyType?: TextInputProps['returnKeyType']
  onSubmitEditing?: TextInputProps['onSubmitEditing']
  keyboardType?: TextInputProps['keyboardType']
  autoFocus?: boolean
  autoCapitalize?: boolean
  placeholderWeight?: '500' | '600' | 'bold'
  otherProps?: any

  onPress?: () => void // Handle case render as a button for search, must include left or right icon
}

type IRef = {
  clear: () => void
}

const TextField: ForwardRefRenderFunction<IRef, IProps> = (props, ref) => {
  const { id, numberOfLines = 0, value, multiline, rich, editable = true } = props
  const [text, setText] = useState(value)
  const [ph, setPlaceholder] = useState(true)
  const [count, setCount] = useState(0)
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
    setPlaceholder(!text || text.length == 0)
    setText(text)
    setCount(text.length)
    props.onChangeText && props.onChangeText(id || props.label, text)
  }

  useEffect(() => {
    if (value !== text) {
      setText(value)
      setCount(value?.length || 0)
    }
  }, [value])

  const renderInputText = useMemo(() => {
    const isExtraComponent = props.leftComponent || props.rightComponent
    return (
      <TextInput
        {...props}
        ref={textRef}
        style={[
          styles.input,
          isExtraComponent
            ? { flex: 1 }
            : {
                ...styles.inputContainer,
                backgroundColor: theme.middle,
                borderColor: theme.gray3,
                borderWidth: theme.id === 'light' ? StyleSheet.hairlineWidth : 0,
              },
          {
            color: theme.text,
            fontWeight: ph && Platform.OS === 'ios' ? (props.placeholderWeight ? props.placeholderWeight : 'bold') : 'normal',
            fontSize: typography.body,
            paddingRight: props.messageType === 'count' && numberOfLines === 1 ? 75 : 0,
          },
          isExtraComponent ? {} : props.style,
        ]}
        disableFullscreenUI={true}
        keyboardAppearance={theme.id === 'light' ? 'light' : 'dark'}
        placeholder={`${props.label || ''}${props.placeholder || ''}`}
        placeholderTextColor={props.placeholderTextColor || `${theme.text}AA`}
        value={rich ? '' : text}
        onChangeText={_handleTextChanged}
        textAlignVertical={numberOfLines >= 2 ? 'top' : 'center'}
        multiline={multiline || numberOfLines >= 2}
        numberOfLines={numberOfLines}
        onSubmitEditing={props.onSubmitEditing}
        blurOnSubmit
        returnKeyType={props.returnKeyType}
        maxLength={props.maxLength}
        keyboardType={props.keyboardType || 'default'}
        autoFocus={props.autoFocus || false}
        autoCapitalize={props.autoCapitalize || 'none'}
        editable={props.onPress ? false : editable}
        {...(props.otherProps ? props.otherProps : {})}
      />
    )
  }, [text, theme.id])

  const Container = ({ children }) => {
    if (props.onPress)
      return (
        <TouchableOpacity style={{ minHeight: 50 }} activeOpacity={1} onPress={props.onPress}>
          {children}
        </TouchableOpacity>
      )
    else return <View style={{ minHeight: 50 }}>{children}</View>
  }

  if (props.leftComponent || props.rightComponent) {
    return (
      <Container>
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              ...styles.inputContainer,
              backgroundColor: theme.middle,
              borderColor: theme.gray3,
              borderWidth: theme.id === 'light' ? StyleSheet.hairlineWidth : 0,
              height: 50,
            },
            props.containerStyle,
          ]}>
          {props.leftComponent || null}
          {props.onPress ? (
            <Text color="gray" style={{ lineHeight: 36 }}>
              {props.label}
            </Text>
          ) : (
            renderInputText
          )}
          {props.rightComponent || null}
        </View>
        {!!props.message && (
          <Subheading
            style={{ marginTop: -10, marginBottom: 10, alignSelf: 'flex-end', marginRight: 5 }}
            color={props.messageType === 'error' ? 'jesusWords' : 'accent'}>
            {props.message}
          </Subheading>
        )}
      </Container>
    )
  }

  return (
    <View style={[{ minHeight: 50 }, props.containerStyle]}>
      {renderInputText}
      {!!props.message && (
        <Subheading
          style={{ marginTop: -10, marginBottom: 10, alignSelf: 'flex-end', marginRight: 5 }}
          color={props.messageType === 'error' ? 'jesusWords' : 'accent'}>
          {props.message}
        </Subheading>
      )}
      {!props.message && props.messageType === 'count' && (
        <Subheading
          style={{
            marginTop: props.numberOfLines === 1 ? -33 : -10,
            marginBottom: 10,
            alignSelf: 'flex-end',
            marginRight: props.numberOfLines === 1 ? 10 : 5,
          }}
          color={'gray'}>
          {`${count} / ${props.maxLength}`}
        </Subheading>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 14,
    fontWeight: '400',
  },
  inputContainer: {
    height: 50,
    paddingLeft: 12,
    borderRadius: 10,
    minHeight: 44,
  },
})

export default forwardRef(TextField)
