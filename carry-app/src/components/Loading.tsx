/**
 * Loading Component
 *
 * @format
 * @flow
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import SpinKit from 'react-native-spinkit'

import { Text } from './Typography'
import ProgressBar from './ProgressBar'
import useTheme from '@hooks/useTheme'

type IProps = {
  color?: string
  message?: string
  progress: number
  showProgress?: boolean
  showSpinner?: boolean
  style?: ViewStyle
  spinnerSize?: number
  centered: boolean
  spinnerType?:
    | 'ThreeBounce'
    | 'CircleFlip'
    | 'Bounce'
    | 'Wave'
    | 'WanderingCubes'
    | 'Pulse'
    | 'ChasingDots'
    | 'Circle'
    | '9CubeGrid'
    | 'WordPress'
    | 'FadingCircle'
    | 'FadingCircleAlt'
    | 'Arc'
    | 'ArcAlt'
    | 'Plane'
}

const Loading = (props: IProps) => {
  const { color } = useTheme()

  return (
    <View style={[s.container, { backgroundColor: color.background }, props.style]}>
      {props.showSpinner ? <SpinKit type={props.spinnerType} size={props.spinnerSize} color={props.color || color.text} /> : null}
      {!props.centered && (
        <>
          {!!props.message && <View style={s.message}>{!!props.message && <Text style={s.loadMsg}>{props.message}</Text>}</View>}
          {props.showProgress && props.progress > 0 ? (
            <View style={s.progressBar}>
              <ProgressBar value={props.progress} color={color.accent} width={130} />
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}

Loading.defaultProps = {
  color: undefined,
  message: undefined,
  progress: 0,
  showProgress: false,
  showSpinner: true,
  style: null,
  spinnerSize: 26,
  centered: false,
  spinnerType: 'ThreeBounce',
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  progressBar: {
    marginTop: 20,
    height: 30,
  },
  message: {
    marginTop: 15,
    height: 30,
  },
  loadMsg: { marginHorizontal: 20, textAlign: 'center' },
})

export default Loading
