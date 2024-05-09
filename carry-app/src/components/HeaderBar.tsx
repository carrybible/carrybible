import Button from '@components/Button'
import { H2 } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Config, Metrics } from '@shared/index'
import React, { ReactElement, useMemo } from 'react'
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import SpinKit from 'react-native-spinkit'
import LinearGradient from 'react-native-linear-gradient'

const HIT_SLOP = { top: 15, left: 15, right: 15, bottom: 15 }

type IProps = {
  title?: string
  titleColor?: string
  colorLeft?: string
  iconLeft?: string | ReactElement
  iconRight?: string
  iconLeftSize?: number
  iconRightSize?: number
  iconLeftFont?: string
  textRight?: string
  iconRightFont?: string
  colorRight?: string
  RightComponent?: any
  onPressLeft?: () => void
  onPressRight?: () => void
  disableRight?: boolean
  style?: StyleProp<ViewStyle>
  borderedBottom?: boolean
  borderedBottomGradient?: boolean
  loading?: boolean
  titleStyle?: StyleProp<ViewStyle>
}

const HeaderBar: React.FC<IProps> = props => {
  const theme = useTheme()

  const normalBorderBottom = props.borderedBottom && !props.borderedBottomGradient
  const gradientBorderBottom = props.borderedBottom && props.borderedBottomGradient

  const RightView = useMemo(() => {
    if (props.iconRight)
      return (
        <Button.Icon
          icon={props.iconRight}
          size={props.iconRightSize || 28}
          font={props.iconRightFont}
          color={props.colorRight}
          style={styles.btnIconRight}
          onPress={props.onPressRight}
        />
      )
    if (props.textRight && !props.loading)
      return (
        <Button.Full
          style={styles.btnRightContainer}
          text={props.textRight}
          textStyle={[styles.textBtnRight, { fontSize: theme.typography.body, color: props.colorRight || theme.color.text }]}
          onPress={props.onPressRight}
          disabled={props.disableRight}>
          {props.textRight}
        </Button.Full>
      )
    if (props.RightComponent) return <View style={styles.btnRightContainer}>{props.RightComponent}</View>
    if (props.loading)
      return (
        <View style={styles.spin}>
          <SpinKit type={'ThreeBounce'} size={26} color={props.colorRight || theme.color.text} />
        </View>
      )
    return <View style={styles.iconClosePlaceholder} />
  }, [
    props.RightComponent,
    props.colorRight,
    props.disableRight,
    props.iconRight,
    props.iconRightFont,
    props.iconRightSize,
    props.loading,
    props.onPressRight,
    props.textRight,
    theme.color.text,
    theme.typography.body,
  ])

  return (
    <>
      <View
        style={[
          styles.container,
          normalBorderBottom ? { borderBottomColor: `${theme.color.text}25`, borderBottomWidth: StyleSheet.hairlineWidth } : {},
          props.style,
        ]}>
        {props.onPressLeft ? (
          typeof props.iconLeft !== 'string' && React.isValidElement(props.iconLeft) ? (
            <TouchableOpacity style={styles.iconClose} onPress={props.onPressLeft} hitSlop={HIT_SLOP}>
              {props.iconLeft}
            </TouchableOpacity>
          ) : (
            <Button.Icon
              icon={props.iconLeft || 'x'}
              size={props.iconLeftSize || 28}
              color={props.colorLeft}
              style={styles.iconClose}
              onPress={props.onPressLeft}
              font={props.iconLeftFont}
              hitSlop={HIT_SLOP}
            />
          )
        ) : (
          <View style={styles.iconClosePlaceholder} />
        )}
        <H2 numberOfLines={1} style={[styles.titleContainer, props.titleStyle, { color: props.titleColor || theme.color.text }]}>
          {props.title}
        </H2>
        {RightView}
      </View>
      {gradientBorderBottom ? (
        <LinearGradient
          style={styles.borderBottom}
          colors={
            Config.VARIANT === 'carry' ? ['#FFA3CF', '#8BACFF', '#C7A7E6'] : [theme.color.accent, theme.color.accent, theme.color.accent]
          }
          start={{ x: -0.5, y: -0.5 }}
          end={{ x: 0.5, y: 0.5 }}
          locations={[0, 0.75, 1]}
          useAngle={true}
          angle={226.05}
          angleCenter={{ x: 0.5, y: 0.5 }}
        />
      ) : null}
    </>
  )
}

HeaderBar.defaultProps = {
  title: '',
  disableRight: false,
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: Metrics.header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  titleContainer: {
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
    textAlign: 'center',
  },
  iconClose: {
    marginLeft: 15,
    paddingVertical: 6,
  },
  iconClosePlaceholder: {
    marginLeft: 15,
    width: 24,
    marginRight: 10,
    paddingVertical: 6,
  },
  borderBottom: {
    height: 3,
    width: '100%',
  },
  textBtnRight: { fontWeight: '700' },
  btnRightContainer: { marginRight: 15 },
  btnIconRight: { marginRight: 15 },
  spin: { marginRight: 15 },
})

export default HeaderBar
