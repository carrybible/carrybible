import React from 'react'
import { Animated, Easing } from 'react-native'
import CircularProgress, { IProps } from './Progress'

const AnimatedPircularProgress = Animated.createAnimatedComponent(CircularProgress)

interface Props extends IProps {
  duration?: number
  easing?: any
  prefill?: number
  useNativeDriver?: boolean
  onAnimationComplete?: () => void
  tintColorSecondary?: string
}

export default class AnimatedProgress extends React.PureComponent<Props, any> {
  static defaultProps = {
    duration: 500,
    easing: Easing.out(Easing.ease),
    prefill: 0,
    useNativeDriver: true,
  }

  constructor(props) {
    super(props)
    this.state = {
      fillAnimation: new Animated.Value(props.prefill),
    }

    this.state.fillAnimation.addListener(({ value }) => props.onFillChange && props.onFillChange(value))
  }

  componentDidMount() {
    this.animate()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fill !== this.props.fill) {
      this.animate()
    }
  }

  reAnimate(prefill?: any, toVal?: any, dur?: any, ease?: any) {
    this.setState(
      {
        fillAnimation: new Animated.Value(prefill),
      },
      () => this.animate(toVal, dur, ease),
    )
  }

  animate(toVal?: any, dur?: any, ease?: any) {
    const toValue = toVal >= 0 ? toVal : this.props.fill
    const duration = dur || this.props.duration
    const easing = ease || this.props.easing
    const useNativeDriver = !!this.props.useNativeDriver

    const anim = Animated.timing(this.state.fillAnimation, {
      useNativeDriver,
      toValue,
      easing,
      duration,
    })
    anim.start(this.props.onAnimationComplete)

    return anim
  }

  animateColor() {
    if (!this.props.tintColorSecondary) {
      return this.props.tintColor
    }

    const tintAnimation = this.state.fillAnimation.interpolate({
      inputRange: [0, 100],
      outputRange: [this.props.tintColor, this.props.tintColorSecondary],
    })

    return tintAnimation
  }

  render() {
    const { fill, prefill, ...other } = this.props

    return <AnimatedPircularProgress {...other} fill={this.state.fillAnimation} tintColor={this.animateColor()} />
  }
}
