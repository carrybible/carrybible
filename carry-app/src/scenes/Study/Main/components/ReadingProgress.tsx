/**
 * Reading Progress
 *
 * @format
 *
 */

import Button from '@components/Button'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

interface Props {
  style?: StyleProp<ViewStyle>
  stepCount: number
  currentStep?: number
  action?: string
  description?: string
  isShowAnswer?: boolean
  onClosePress?: () => void
  isPercent?: boolean
  hideProgressBar?: boolean
}

const ReadingProgress: React.FC<Props> = props => {
  const { color } = useTheme()
  const textColor = props.isShowAnswer ? color.white : color.text

  return (
    <View style={[s.container, props.style]}>
      <View style={s.steps}>
        {props.stepCount === 0 || props.hideProgressBar
          ? null
          : new Array(props.stepCount)
              .fill(0)
              .map((_, i) => (
                <View
                  key={i}
                  style={
                    i <= (props.currentStep || 0) - 1
                      ? { ...s.activeStep, backgroundColor: color.accent2 }
                      : { ...s.inactiveStep, backgroundColor: `${color.accent2}55` }
                  }
                />
              ))}
      </View>
      <Button.Icon icon="x" size={35} color={textColor} onPress={props.onClosePress} />
    </View>
  )
}

ReadingProgress.defaultProps = {}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Metrics.insets.horizontal,
    flexDirection: 'row',
    paddingBottom: 15,
  },
  steps: {
    flexDirection: 'row',
    height: 35,
    paddingHorizontal: -3,
    paddingTop: 8,
    flex: 1,
  },
  activeStep: {
    height: 6,
    borderRadius: 3,
    flex: 1,
    marginHorizontal: 3,
  },
  inactiveStep: {
    height: 6,
    borderRadius: 3,
    flex: 1,
    marginHorizontal: 3,
  },
})

export default ReadingProgress
