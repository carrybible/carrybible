import React, { useMemo } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  TextStyle,
  Image,
  ImageSourcePropType,
} from 'react-native'
import SpinKit from 'react-native-spinkit'
import { Config, Metrics } from '../shared'
import { H2 } from './Typography'
import useTheme from '@hooks/useTheme'
import { Color } from '@dts/index'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type IProps = {
  title: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  titleStyle?: StyleProp<TextStyle>
  disabled?: boolean
  backgroundColor?: keyof Color
  textColor?: keyof Color
  rounded?: boolean
  loading?: boolean
  avoidKeyboard?: boolean
  keyboardVerticalOffset?: number
  secondary?: boolean
  leftIcon?: ImageSourcePropType
  light?: boolean
}

const BottomButton: React.FC<IProps> = props => {
  const { color: theme } = useTheme()
  const insets = useSafeAreaInsets()
  const btnStyle = useMemo(
    () => [
      styles.container,
      {
        opacity: props.disabled || props.loading ? 0.6 : 1,
        backgroundColor: props.light ? theme.lightBackground : theme[props.backgroundColor || 'primary'],
      },
      props.rounded ? styles.rounded : {},
      props.secondary
        ? {
            backgroundColor: theme.background,
            borderColor: props.light ? theme.lightBackground : theme[props.backgroundColor || 'primary'],
            ...styles.secondary,
          }
        : {},
      props.style,
    ],
    [props.backgroundColor, props.disabled, props.loading, props.rounded, props.secondary, props.style, theme, props.light],
  )

  const Content = useMemo(
    () => (
      <TouchableOpacity activeOpacity={0.8} onPress={props.onPress} disabled={props.disabled || props.loading} style={btnStyle}>
        {props.leftIcon ? <Image style={[styles.leftIcon, { tintColor: theme.primary }]} source={props.leftIcon} /> : null}
        {!props.loading ? (
          <H2
            bold
            style={[
              { color: props.light ? theme.lightText : theme[props.textColor || 'white'] },
              props.secondary
                ? { color: props.light ? theme.lightTextSecondary : theme.accent }
                : {},
              Platform.OS === 'ios' && styles.title,
              styles.commonTitle,
              props.titleStyle,
            ]}>
            {props.title}
          </H2>
        ) : (
          <SpinKit type="ThreeBounce" size={22} color={theme[props.textColor || 'white']} />
        )}
      </TouchableOpacity>
    ),
    [
      btnStyle,
      props.disabled,
      props.leftIcon,
      props.light,
      props.loading,
      props.onPress,
      props.secondary,
      props.textColor,
      props.title,
      props.titleStyle,
      theme,
    ],
  )

  if (Platform.OS === 'android') {
    return Content
  }

  return (
    <KeyboardAvoidingView
      behavior="position"
      keyboardVerticalOffset={props.keyboardVerticalOffset || 56 + insets.bottom}
      enabled={props.avoidKeyboard && Platform.OS === 'ios'}>
      {Content}
    </KeyboardAvoidingView>
  )
}

BottomButton.defaultProps = {
  disabled: false,
  rounded: false,
  loading: false,
  avoidKeyboard: true,
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    marginTop: 3,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  commonTitle: {
    textAlign: 'center',
  },
  rounded: {
    marginHorizontal: Metrics.insets.horizontal,
    borderRadius: 10,
    borderTopWidth: 0,
  },
  title: {
    fontWeight: '700',
  },
  secondary: {
    borderWidth: 2,
    borderTopWidth: 2,
  },
  leftIcon: {
    marginRight: 5,
    maxHeight: 40,
    maxWidth: 40,
    resizeMode: 'contain',
  },
})

export default BottomButton
