/**
 * Reading Progress
 *
 * @format
 *
 */

import React from 'react'
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native'
import Button from '@components/Button'
import useTheme from '@hooks/useTheme'
import { Subheading } from '@components/Typography'
import { Metrics } from '@shared/index'
import LinearGradient from 'react-native-linear-gradient'
import ProgressBar from '@components/ProgressBar'

interface Props {
  percent: number
  action?: string
  description?: string
  isShowAnswer: boolean
  onClosePress?: () => void
}

const GoalActivityProgress: React.FC<Props> = props => {
  const { color } = useTheme()
  const maxLength = 30
  const colors = props.isShowAnswer ? ['transparent', 'transparent'] : [color.background, `${color.background}00`]
  const textColor = props.isShowAnswer ? color.white : color.text
  return (
    <LinearGradient colors={colors} locations={[0.7, 1]} style={[s.container, { zIndex: 3 }]}>
      <View style={{ height: 15, marginBottom: 5 }}>
        <ProgressBar
          shining
          value={props.percent}
          width="100%"
          style={{ flex: 1, backgroundColor: '#CDDBFF', height: 21 }}
          backgroundColor={props.isShowAnswer ? color.gray : color.gray7}
        />
      </View>
      <TouchableOpacity style={{ flexDirection: 'row' }} onPress={props.onClosePress}>
        {/* button close */}
        <Button.Icon
          icon="x"
          size={16}
          color={textColor}
          hitSlop={{ top: 15, left: 15, right: 15, bottom: 15 }}
          onPress={props.onClosePress}
        />

        {/* name of step */}
        <Subheading bold style={{ marginLeft: 5, color: textColor }}>
          {props.action}
        </Subheading>
        <Subheading style={{ marginLeft: 5, color: `${textColor}AA` }} numberOfLines={1}>
          {(props.description ?? '').length > maxLength ? (props.description ?? '').substring(0, maxLength - 1) + '...' : props.description}
        </Subheading>
      </TouchableOpacity>
    </LinearGradient>
  )
}

GoalActivityProgress.defaultProps = {}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Metrics.insets.horizontal,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 15,
    zIndex: 2,
    justifyContent: 'center',
  },
  steps: {
    flexDirection: 'row',
    height: 15,
    paddingHorizontal: -3,
    backgroundColor: 'transparent',
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

export default GoalActivityProgress
