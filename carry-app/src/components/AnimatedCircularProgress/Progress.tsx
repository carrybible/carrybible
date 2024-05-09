import React from 'react'
import { View, StyleProp, ViewStyle, Animated } from 'react-native'
import { Svg, Path, G } from 'react-native-svg'

export interface IProps {
  style?: StyleProp<ViewStyle>
  size: number
  fill: number | Animated.Value
  width: number
  backgroundWidth?: number
  tintColor?: any
  tintTransparency?: boolean
  backgroundColor?: string
  rotation?: number
  lineCap?: 'butt' | 'round' | 'square'
  fillLineCap?: 'butt' | 'round' | 'square'
  arcSweepAngle?: number
  children?: (fill: number) => JSX.Element
  childrenContainerStyle?: StyleProp<ViewStyle>
  padding?: number
  renderCap?: (payload: { center: { x: number; y: number } }) => React.ReactNode
  dashedTint?: Array<number>
  dashedBackground?: Array<number>
}

export default class Progress extends React.PureComponent<IProps, any> {
  static defaultProps = {
    tintColor: 'black',
    tintTransparency: true,
    rotation: 0,
    lineCap: 'butt',
    arcSweepAngle: 360,
    padding: 0,
    dashedBackground: [],
    dashedTint: [],
  }

  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  circlePath(x, y, radius, startAngle, endAngle) {
    const start = this.polarToCartesian(x, y, radius, startAngle)
    const end = this.polarToCartesian(x, y, radius, endAngle * 0.9999)

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y]
    return d.join(' ')
  }

  clampFill = fill => Math.min(100, Math.max(0, fill))

  render() {
    const {
      size,
      width,
      backgroundWidth,
      tintColor,
      tintTransparency,
      backgroundColor,
      style,
      rotation,
      lineCap,
      fillLineCap = lineCap,
      arcSweepAngle,
      fill,
      children,
      childrenContainerStyle,
      padding,
      renderCap,
      dashedBackground,
      dashedTint,
    } = this.props

    const maxWidthCircle = backgroundWidth ? Math.max(width, backgroundWidth) : width
    const center = (size + padding!) * 0.5
    const radius = (size - maxWidthCircle - padding!) * 0.5

    const currentFillAngle = (arcSweepAngle! * this.clampFill(fill)) / 100
    const backgroundPath = this.circlePath(center, center, radius, tintTransparency ? 0 : currentFillAngle, arcSweepAngle)
    const circlePath = this.circlePath(center, center, radius, 0, currentFillAngle)
    const coordinate = this.polarToCartesian(center, center, radius, currentFillAngle)
    const cap = this.props.renderCap ? this.props.renderCap({ center: coordinate }) : null

    const offset = size - maxWidthCircle * 2

    return (
      <View style={style}>
        <Svg width={size + padding!} height={size + padding!}>
          <G rotation={rotation} originX={(size + padding!) / 2} originY={(size + padding!) / 2}>
            {backgroundColor && (
              <Path
                d={backgroundPath}
                stroke={backgroundColor}
                strokeWidth={backgroundWidth || width}
                strokeLinecap={lineCap}
                strokeDasharray={dashedBackground?.length ? dashedBackground : [0, 0]}
                fill="transparent"
              />
            )}
            {fill > 0 && (
              <Path
                d={circlePath}
                stroke={tintColor}
                strokeWidth={width}
                strokeLinecap={fillLineCap}
                strokeDasharray={dashedTint?.length ? dashedTint : [0, 0]}
                fill="transparent"
              />
            )}
            {cap}
          </G>
        </Svg>
        {children && (
          <View
            style={[
              {
                position: 'absolute',
                left: maxWidthCircle + padding! / 2,
                top: maxWidthCircle + padding! / 2,
                width: offset,
                height: offset,
                borderRadius: offset / 2,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              },
              childrenContainerStyle,
            ]}
          >
            {children(fill)}
          </View>
        )}
      </View>
    )
  }
}
