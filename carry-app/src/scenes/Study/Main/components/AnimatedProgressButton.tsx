/**
 * AnimatedProgressButton
 *
 * @format
 *
 */

import React from 'react'
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Metrics } from '@shared/index'
import { H2 } from '@components/Typography'
import colors from 'src/config/color'
import Loading from '@components/Loading'
import Color from '@dts/color'
interface Props {
  hidden?: boolean
  text: string
  initialEnabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  bold?: boolean
  alwaysEnabled?: boolean
  loading?: boolean
  color?: Color
}

Animated.interpolateNode

const MAX = 0.95

export interface AnimatedProgressButtonRef {
  progress: (val: number) => void
}

class AnimatedProgressButton extends React.Component<Props> {
  state = { maxWidth: Metrics.screen.width - Metrics.insets.horizontal * 2, enabled: this.props.initialEnabled }
  maxProgress = 0
  animation = new Animated.Value(this.props.initialEnabled ? MAX : 0)

  handleLayout = (event: any) => {
    var { width } = event.nativeEvent.layout
    this.setState({ maxWidth: width })
  }

  progress = (val: any) => {
    if (val > this.maxProgress) {
      const limit = Math.min(val, MAX) as any
      this.animation.setValue(limit)
      this.maxProgress = limit
      if (limit === MAX) this.setState({ enabled: true })
    }
  }

  render() {
    if (this.props.hidden) return null

    return (
      <TouchableOpacity
        style={[
          s.container,
          {
            opacity: this.state.enabled || this.props.alwaysEnabled ? 1 : 0.6,
            backgroundColor: this.props.backgroundColor || `${this.props.color.primary}40`,
            borderWidth: this.props.borderWidth || 0,
            borderColor: this.props.borderColor || `${this.props.color.primary}40`,
          },
          this.props.style,
        ]}
        onLayout={this.handleLayout}
        disabled={(!this.props.alwaysEnabled && !this.state.enabled) || this.props.loading}
        onPress={this.props.onPress}
      >
        {this.props.loading ? (
          <Loading style={{ flex: 1, backgroundColor: 'transparent' }} />
        ) : (
          <>
            {this.props.alwaysEnabled ? null : (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 10,
                    backgroundColor: this.props.backgroundColor || this.props.color?.primary,
                    width: Animated.interpolateNode(this.animation, {
                      inputRange: [0, MAX],
                      outputRange: [0, this.state.maxWidth],
                    }),
                  },
                ]}
              />
            )}
            <H2 bold={this.props.bold || true} style={{ color: this.props.alwaysEnabled ? this.props.color?.primary : 'white' }}>
              {this.props.text}
            </H2>
          </>
        )}
      </TouchableOpacity>
    )
  }
}

const s = StyleSheet.create({
  container: {
    height: 50,
    marginHorizontal: Metrics.insets.horizontal,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default AnimatedProgressButton
